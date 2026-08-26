import {
  classifyWaitlistDbError,
  formatWaitlistDbErrorLog,
} from "@/lib/waitlist/diagnostics";
import type {
  ReaderClaim,
  ReaderClaimAddInput,
  ReaderClaimRepository,
  ReaderClaimStatus,
} from "@/lib/reader/types";

/** קליינט SQL גנרי (מסופק ע"י Pool של pg) — שומר על בדיקוּת והפרדה. */
export interface SqlClient {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

/**
 * יצירת הסכימה באופן אידמפוטנטי — זהה ל-migration הקנוני
 * (src/lib/reader/migrations/001_create_reader_claims.sql). המשפט הראשון
 * (create table) קריטי; ההקשחה (index / RLS / revoke) היא best-effort.
 */
const CREATE_TABLE_SQL = `
  create table if not exists reader_claims (
    id                bigint generated always as identity primary key,
    name              text        not null,
    email_normalized  text        not null unique,
    email_original    text        not null,
    order_ref         text        not null,
    source            text        not null,
    consent_version   text        not null,
    consent_at        timestamptz not null default now(),
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    status            text        not null default 'pending'
                         check (status in ('pending', 'approved', 'rejected')),
    access_token      text        unique,
    approved_at       timestamptz
  )
`;

const HARDENING_SQL = [
  `create index if not exists reader_claims_status_idx on reader_claims (status)`,
  `create index if not exists reader_claims_token_idx on reader_claims (access_token)`,
  `alter table reader_claims enable row level security`,
  `revoke all on table reader_claims from public, anon, authenticated`,
];

function rowToClaim(row: unknown): ReaderClaim | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  return {
    emailNormalized: String(r.email_normalized),
    status: String(r.status) as ReaderClaimStatus,
    accessToken: r.access_token == null ? null : String(r.access_token),
  };
}

/**
 * מימוש Postgres להפעלות ערכת-הקורא. upsert לפי `email_normalized` מונע
 * כפילויות; הגשה חוזרת מחזירה ל-pending (מבלי לחשוף אם ההפעלה כבר קיימת).
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

  async createPending(input: ReaderClaimAddInput): Promise<void> {
    await this.ensureSchema();
    await this.db.query(
      `insert into reader_claims
         (name, email_normalized, email_original, order_ref, source, consent_version)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (email_normalized) do update set
         name = excluded.name,
         email_original = excluded.email_original,
         order_ref = excluded.order_ref,
         source = excluded.source,
         consent_version = excluded.consent_version,
         status = 'pending',
         access_token = null,
         approved_at = null,
         updated_at = now()`,
      [
        input.name,
        input.emailNormalized,
        input.emailOriginal,
        input.orderRef,
        input.source,
        input.consentVersion,
      ],
    );
  }

  async approve(
    emailNormalized: string,
    accessToken: string,
  ): Promise<ReaderClaim | null> {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `update reader_claims set
         status = 'approved',
         access_token = coalesce(access_token, $2),
         approved_at = coalesce(approved_at, now()),
         updated_at = now()
       where email_normalized = $1
       returning email_normalized, status, access_token`,
      [emailNormalized, accessToken],
    );
    return rows.length ? rowToClaim(rows[0]) : null;
  }

  async reject(emailNormalized: string): Promise<void> {
    await this.ensureSchema();
    await this.db.query(
      `update reader_claims set
         status = 'rejected', access_token = null, approved_at = null, updated_at = now()
       where email_normalized = $1`,
      [emailNormalized],
    );
  }

  async findByAccessToken(accessToken: string): Promise<ReaderClaim | null> {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `select email_normalized, status, access_token
         from reader_claims
        where access_token = $1 and status = 'approved'
        limit 1`,
      [accessToken],
    );
    return rows.length ? rowToClaim(rows[0]) : null;
  }
}
