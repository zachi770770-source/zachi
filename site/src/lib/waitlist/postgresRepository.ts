import type { WaitlistAddInput, WaitlistRepository } from "@/lib/waitlist/types";

/** קליינט SQL גנרי (מסופק ע"י Pool של pg) — שומר על בדיקוּת והפרדה. */
export interface SqlClient {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

/**
 * מימוש Postgres לרשימת ההמתנה. ה-upsert לפי `email_normalized` מבטיח
 * שאין כפילויות, והרשמה חוזרת מחזירה נרשם ל-active מבלי לחשוף מידע.
 */
export class PostgresWaitlistRepository implements WaitlistRepository {
  constructor(private readonly db: SqlClient) {}

  async add(input: WaitlistAddInput): Promise<void> {
    await this.db.query(
      `insert into waitlist_subscribers
         (email_normalized, email_original, source, consent_version, consent_at, status)
       values ($1, $2, $3, $4, now(), 'active')
       on conflict (email_normalized) do update
         set status = 'active',
             source = excluded.source,
             consent_version = excluded.consent_version,
             consent_at = now(),
             updated_at = now()`,
      [
        input.emailNormalized,
        input.emailOriginal,
        input.source,
        input.consentVersion,
      ]
    );
  }

  async unsubscribe(emailNormalized: string): Promise<void> {
    await this.db.query(
      `update waitlist_subscribers
         set status = 'unsubscribed', updated_at = now()
       where email_normalized = $1`,
      [emailNormalized]
    );
  }
}
