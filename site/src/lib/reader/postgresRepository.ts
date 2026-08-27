import {
  classifyWaitlistDbError,
  formatWaitlistDbErrorLog,
} from "@/lib/waitlist/diagnostics";
import type { ReaderProofMime } from "@/lib/reader/proof";
import { READER_PROOF_ALLOWED_MIME } from "@/lib/reader/proof";
import type {
  ReaderApprovedClaim,
  ReaderClaimCreateInput,
  ReaderClaimRepository,
  ReaderClaimStatus,
  ReaderPendingClaim,
  ReaderProofBlob,
} from "@/lib/reader/types";

/** קליינט SQL גנרי (מסופק ע"י Pool של pg) — שומר על בדיקוּת והפרדה. */
export interface SqlClient {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

/**
 * יצירת הסכימה באופן אידמפוטנטי — זהה ל-migration הקנוני
 * (src/lib/reader/migrations/001_create_reader_claims.sql). המשפט הראשון
 * (create table) קריטי; ההקשחה (index / RLS / revoke) היא best-effort.
 *
 * הוכחת-הרכישה נשמרת כ-bytea *בתוך* הטבלה — פרטית לחלוטין, נגישה שרת-בלבד,
 * לעולם לא כ-URL ציבורי. נמחקת (null) עם ההכרעה (מינימום PII).
 */
const CREATE_TABLE_SQL = `
  create table if not exists reader_claims (
    id                       bigint generated always as identity primary key,
    email_normalized         text        not null unique,
    consent_version          text        not null,
    consent_at               timestamptz not null default now(),
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now(),
    status                   text        not null default 'pending'
                               check (status in ('pending', 'approved', 'rejected')),
    proof_mime               text,
    proof_size               integer,
    proof_bytes              bytea,
    access_token_hash        text        unique,
    access_token_expires_at  timestamptz,
    reviewed_at              timestamptz,
    approved_at              timestamptz
  )
`;

const HARDENING_SQL = [
  `create index if not exists reader_claims_status_idx on reader_claims (status)`,
  `create index if not exists reader_claims_token_idx on reader_claims (access_token_hash)`,
  `alter table reader_claims enable row level security`,
  `revoke all on table reader_claims from public, anon, authenticated`,
];

function coerceMime(value: unknown): ReaderProofMime | null {
  const s = value == null ? null : String(value);
  return (READER_PROOF_ALLOWED_MIME as readonly string[]).includes(s ?? "")
    ? (s as ReaderProofMime)
    : null;
}

/**
 * מימוש Postgres להפעלות ערכת-הקורא. upsert לפי `email_normalized`; הגשה חוזרת
 * מחזירה ל-pending עם הוכחה חדשה. bytea של ההוכחה מנוהל שרת-בלבד.
 */
export class PostgresReaderClaimRepository implements ReaderClaimRepository {
  private schemaReady: Promise<void> | null = null;

  constructor(private readonly db: SqlClient) {}

  private async ensureSchema(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = (async () => {
        await this.db.query(CREATE_TABLE_SQL);
        for (const stmt of HARDENING_SQL) {
          try {
            await this.db.query(stmt);
          } catch (err) {
            console.warn(formatWaitlistDbErrorLog(classifyWaitlistDbError(err)));
          }
        }
      })().catch((err) => {
        this.schemaReady = null; // אפשר ניסיון חוזר בבקשה הבאה
        throw err;
      });
    }
    return this.schemaReady;
  }

  async createPending(input: ReaderClaimCreateInput): Promise<void> {
    await this.ensureSchema();
    await this.db.query(
      `insert into reader_claims
         (email_normalized, consent_version, status, proof_mime, proof_size, proof_bytes)
       values ($1, $2, 'pending', $3, $4, $5)
       on conflict (email_normalized) do update set
         consent_version = excluded.consent_version,
         consent_at = now(),
         status = 'pending',
         proof_mime = excluded.proof_mime,
         proof_size = excluded.proof_size,
         proof_bytes = excluded.proof_bytes,
         access_token_hash = null,
         access_token_expires_at = null,
         reviewed_at = null,
         approved_at = null,
         updated_at = now()`,
      [
        input.emailNormalized,
        input.consentVersion,
        input.proof.mime,
        input.proof.bytes.length,
        input.proof.bytes,
      ],
    );
  }

  async listPending(limit: number): Promise<ReaderPendingClaim[]> {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `select email_normalized, status, proof_mime, proof_size, created_at
         from reader_claims
        where status = 'pending'
        order by created_at asc
        limit $1`,
      [limit],
    );
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        emailNormalized: String(r.email_normalized),
        status: String(r.status) as ReaderClaimStatus,
        proofMime: coerceMime(r.proof_mime),
        proofSize: r.proof_size == null ? null : Number(r.proof_size),
        createdAt: new Date(String(r.created_at)),
      };
    });
  }

  async getProof(emailNormalized: string): Promise<ReaderProofBlob | null> {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `select proof_mime, proof_bytes from reader_claims where email_normalized = $1 limit 1`,
      [emailNormalized],
    );
    if (!rows.length) return null;
    const r = rows[0] as Record<string, unknown>;
    const mime = coerceMime(r.proof_mime);
    const bytes = r.proof_bytes;
    if (!mime || !bytes || !Buffer.isBuffer(bytes)) return null;
    return { mime, bytes };
  }

  async approve(
    emailNormalized: string,
    accessTokenHash: string,
    expiresAt: Date,
  ): Promise<ReaderApprovedClaim | null> {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `update reader_claims set
         status = 'approved',
         access_token_hash = $2,
         access_token_expires_at = $3,
         proof_bytes = null,
         reviewed_at = now(),
         approved_at = coalesce(approved_at, now()),
         updated_at = now()
       where email_normalized = $1
       returning email_normalized`,
      [emailNormalized, accessTokenHash, expiresAt.toISOString()],
    );
    return rows.length ? { emailNormalized } : null;
  }

  async reject(emailNormalized: string): Promise<void> {
    await this.ensureSchema();
    await this.db.query(
      `update reader_claims set
         status = 'rejected',
         access_token_hash = null,
         access_token_expires_at = null,
         proof_bytes = null,
         reviewed_at = now(),
         updated_at = now()
       where email_normalized = $1`,
      [emailNormalized],
    );
  }

  async findApprovedByAccessTokenHash(
    accessTokenHash: string,
  ): Promise<ReaderApprovedClaim | null> {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `select email_normalized
         from reader_claims
        where access_token_hash = $1
          and status = 'approved'
          and access_token_expires_at is not null
          and access_token_expires_at > now()
        limit 1`,
      [accessTokenHash],
    );
    return rows.length
      ? { emailNormalized: String((rows[0] as Record<string, unknown>).email_normalized) }
      : null;
  }
}
