import type {
  WaitlistAddInput,
  WaitlistRepository,
  WaitlistStats,
  WaitlistStatsRange,
} from "@/lib/waitlist/types";
import {
  classifyWaitlistDbError,
  formatWaitlistDbErrorLog,
} from "@/lib/waitlist/diagnostics";

/** קליינט SQL גנרי (מסופק ע"י Pool של pg) — שומר על בדיקוּת והפרדה. */
export interface SqlClient {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

/**
 * יצירת הסכימה באופן אידמפוטנטי. זהה בתוכן ל-migration הקנוני
 * (src/lib/waitlist/migrations/001_create_waitlist_subscribers.sql) ומורץ פעם
 * אחת לכל תהליך, כך שהרשמה לרשימת ההמתנה לא נכשלת ב-500 כאשר הטבלה טרם נוצרה.
 *
 * המשפט הראשון (create table) הוא קריטי; אם הוא נכשל — נכשלת יצירת הסכימה.
 * שאר המשפטים (index / RLS / revoke) הם הקשחה ומורצים כ-best-effort בנפרד,
 * כדי שהרשאה חסרה עליהם לא תבטל את יצירת הטבלה ולא תחסום כתיבה.
 */
const CREATE_TABLE_SQL = `
  create table if not exists waitlist_subscribers (
    id                bigint generated always as identity primary key,
    email_normalized  text        not null unique,
    email_original    text        not null,
    source            text        not null,
    consent_version   text        not null,
    consent_at        timestamptz not null default now(),
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    status            text        not null default 'active'
                         check (status in ('active', 'unsubscribed')),
    notified_at       timestamptz,
    persona           text,
    persona_source    text
  )
`;

const HARDENING_SQL = [
  // עמודות הפרסונה — best-effort לטבלה שכבר קיימת ממיגרציה מוקדמת (002).
  `alter table waitlist_subscribers add column if not exists persona text`,
  `alter table waitlist_subscribers add column if not exists persona_source text`,
  `create index if not exists waitlist_subscribers_status_idx
     on waitlist_subscribers (status)`,
  `alter table waitlist_subscribers enable row level security`,
  `revoke all on table waitlist_subscribers from public, anon, authenticated`,
];

/**
 * מימוש Postgres לרשימת ההמתנה. ה-upsert לפי `email_normalized` מבטיח
 * שאין כפילויות, והרשמה חוזרת מחזירה נרשם ל-active מבלי לחשוף מידע.
 */
export class PostgresWaitlistRepository implements WaitlistRepository {
  /** ננעל להרצה יחידה מוצלחת; מאופס בכישלון כדי לנסות שוב בבקשה הבאה. */
  private schemaReady: Promise<void> | null = null;

  constructor(private readonly db: SqlClient) {}

  private async ensureSchema(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = (async () => {
        // קריטי: יצירת הטבלה. כישלון כאן → זריקה (הקורא ימשיך לנסות לכתוב).
        await this.db.query(CREATE_TABLE_SQL);
        // best-effort: אינדקס והקשחת RLS. כישלון בהם לא חוסם כתיבה.
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

  async add(input: WaitlistAddInput): Promise<void> {
    // מוודאים שהסכימה קיימת. אם יצירתה נכשלה עדיין מנסים לכתוב — ייתכן
    // שהטבלה כבר קיימת ממיגרציה ידנית; שגיאת כתיבה אמיתית תטופל ע"י הקורא.
    try {
      await this.ensureSchema();
    } catch {
      // נמשיך לניסיון הכתיבה בכל מקרה.
    }

    await this.db.query(
      `insert into waitlist_subscribers
         (email_normalized, email_original, source, consent_version, consent_at, status, persona, persona_source)
       values ($1, $2, $3, $4, now(), 'active', $5, $6)
       on conflict (email_normalized) do update
         set status = 'active',
             source = excluded.source,
             consent_version = excluded.consent_version,
             persona = excluded.persona,
             persona_source = excluded.persona_source,
             consent_at = now(),
             updated_at = now()`,
      [
        input.emailNormalized,
        input.emailOriginal,
        input.source,
        input.consentVersion,
        input.persona ?? null,
        input.personaSource ?? null,
      ]
    );
  }

  async unsubscribe(emailNormalized: string): Promise<void> {
    try {
      await this.ensureSchema();
    } catch {
      // נמשיך לניסיון העדכון בכל מקרה.
    }

    await this.db.query(
      `update waitlist_subscribers
         set status = 'unsubscribed', updated_at = now()
       where email_normalized = $1`,
      [emailNormalized]
    );
  }

  async signupStats(range: WaitlistStatsRange): Promise<WaitlistStats> {
    try {
      await this.ensureSchema();
    } catch {
      /* נמשיך לשאילתה בכל מקרה. */
    }
    const from = range.from.toISOString();
    const to = range.to.toISOString();
    const [{ rows: totals }, { rows: byDay }] = await Promise.all([
      this.db.query(
        `select count(*) filter (where status = 'active')::int as total
           from waitlist_subscribers
          where created_at >= $1 and created_at < $2`,
        [from, to],
      ),
      this.db.query(
        `select to_char(date_trunc('day', created_at at time zone 'UTC'), 'YYYY-MM-DD') as day,
                count(*) filter (where status = 'active')::int as count
           from waitlist_subscribers
          where created_at >= $1 and created_at < $2
          group by 1 order by 1`,
        [from, to],
      ),
    ]);
    const num = (v: unknown) => (v == null ? 0 : Number(v));
    return {
      total: num((totals[0] as Record<string, unknown> | undefined)?.total),
      byDay: byDay.map((r) => {
        const rr = r as Record<string, unknown>;
        return { day: String(rr.day), count: num(rr.count) };
      }),
    };
  }
}
