import {
  classifyWaitlistDbError,
  formatWaitlistDbErrorLog,
} from "@/lib/waitlist/diagnostics";
import type {
  ReaderAccessRepository,
  ReaderActivationInput,
  ReaderSession,
} from "@/lib/reader/types";

/** קליינט SQL גנרי (מסופק ע"י Pool של pg) — שומר על בדיקוּת והפרדה. */
export interface SqlClient {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

/**
 * יצירת הסכימה באופן אידמפוטנטי — זהה ל-migration הקנוני
 * (src/lib/reader/migrations/001_create_reader_activations.sql). המשפט הראשון
 * (create table) קריטי; ההקשחה (index / RLS / revoke) היא best-effort.
 */
const CREATE_TABLE_SQL = `
  create table if not exists reader_activations (
    id                  bigint generated always as identity primary key,
    email_normalized    text        not null unique,
    consent_version     text        not null,
    consent_at          timestamptz not null default now(),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    session_token_hash  text        unique,
    session_expires_at  timestamptz,
    session_revoked_at  timestamptz
  )
`;

const HARDENING_SQL = [
  `create index if not exists reader_activations_session_idx on reader_activations (session_token_hash)`,
  `alter table reader_activations enable row level security`,
  `revoke all on table reader_activations from public, anon, authenticated`,
];

function rowToSession(row: unknown): ReaderSession | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  return { emailNormalized: String(r.email_normalized) };
}

/**
 * מימוש Postgres לגישת ערכת-הקורא. upsert לפי `email_normalized`; הגשה חוזרת
 * מרעננת הסכמה ומחליפה את הסשן הפעיל. במסד נשמר רק hash של אסימון-הסשן.
 */
export class PostgresReaderAccessRepository implements ReaderAccessRepository {
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

  async activate(input: ReaderActivationInput): Promise<void> {
    await this.ensureSchema();
    await this.db.query(
      `insert into reader_activations
         (email_normalized, consent_version, consent_at,
          session_token_hash, session_expires_at, session_revoked_at)
       values ($1, $2, now(), $3, $4, null)
       on conflict (email_normalized) do update set
         consent_version    = excluded.consent_version,
         consent_at         = now(),
         session_token_hash = excluded.session_token_hash,
         session_expires_at = excluded.session_expires_at,
         session_revoked_at = null,
         updated_at         = now()`,
      [
        input.emailNormalized,
        input.consentVersion,
        input.sessionTokenHash,
        input.sessionExpiresAt.toISOString(),
      ],
    );
  }

  async findValidSession(sessionTokenHash: string): Promise<ReaderSession | null> {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `select email_normalized
         from reader_activations
        where session_token_hash = $1
          and session_revoked_at is null
          and session_expires_at is not null
          and session_expires_at > now()
        limit 1`,
      [sessionTokenHash],
    );
    return rows.length ? rowToSession(rows[0]) : null;
  }

  async revokeSession(sessionTokenHash: string): Promise<void> {
    await this.ensureSchema();
    await this.db.query(
      `update reader_activations set
         session_revoked_at = now(), updated_at = now()
       where session_token_hash = $1`,
      [sessionTokenHash],
    );
  }
}
