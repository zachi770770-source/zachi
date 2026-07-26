import "server-only";

import type { SqlClient } from "@/lib/compass/types";
import { COMPASS_LIMITS } from "@/lib/compass/assistant/config";

/**
 * מכסת השימוש בצד השרת. אכיפה אטומית על מסד הנתונים (upsert יחיד) כדי
 * שרענון/חלון חדש/כרטיסיות מרובות לא יאפסו ולא יעקפו את המכסה. שומרים רק
 * sha256 של המזהה האנונימי — לא IP, לא אימייל, לא תוכן.
 */

export interface QuotaState {
  allowed: boolean;
  /** נותרו היום (מתוך perDay). */
  remainingDay: number;
  /** נותרו מצטבר (מתוך lifetime). */
  remainingLifetime: number;
  /** המינימום מבין השניים — המספר להצגה למשתמש. */
  remaining: number;
}

const globalForQuota = globalThis as unknown as { compassUsageSchemaReady?: boolean };

/** יצירת טבלת המכסה אידמפוטנטית (פעם אחת לכל תהליך). */
export async function ensureQuotaSchema(db: SqlClient): Promise<void> {
  if (globalForQuota.compassUsageSchemaReady) return;
  await db.query(`
    create table if not exists compass_usage (
      subject_hash   text primary key,
      lifetime_count integer     not null default 0,
      window_start   timestamptz not null default now(),
      window_count   integer     not null default 0,
      created_at     timestamptz not null default now(),
      updated_at     timestamptz not null default now()
    )
  `);
  for (const stmt of [
    `alter table compass_usage enable row level security`,
    `revoke all on table compass_usage from public, anon, authenticated`,
  ]) {
    try {
      await db.query(stmt);
    } catch {
      /* הקשחה best-effort — היעדר הרשאה לא יבטל את יצירת הטבלה */
    }
  }
  globalForQuota.compassUsageSchemaReady = true;
}

function toState(row: { remaining_day: number | string; remaining_lifetime: number | string } | undefined, allowed: boolean): QuotaState {
  const remainingDay = Math.max(0, Number(row?.remaining_day ?? COMPASS_LIMITS.perDay));
  const remainingLifetime = Math.max(0, Number(row?.remaining_lifetime ?? COMPASS_LIMITS.lifetime));
  return {
    allowed,
    remainingDay,
    remainingLifetime,
    remaining: Math.min(remainingDay, remainingLifetime),
  };
}

/**
 * בודק וצורך שאלה אחת אטומית. אם המכסה מוצתה (יומית או מצטברת) — לא מגדיל
 * ומחזיר allowed=false. חלון היממה מתאפס אוטומטית לאחר 24 שעות.
 */
export async function consumeQuota(db: SqlClient, subjectHash: string): Promise<QuotaState> {
  const perDay = COMPASS_LIMITS.perDay;
  const lifetime = COMPASS_LIMITS.lifetime;

  const upsert = await db.query(
    `insert into compass_usage (subject_hash, lifetime_count, window_start, window_count)
       values ($1, 1, now(), 1)
     on conflict (subject_hash) do update set
       window_start = case when now() - compass_usage.window_start >= interval '24 hours'
                           then now() else compass_usage.window_start end,
       window_count = case when now() - compass_usage.window_start >= interval '24 hours'
                           then 1 else compass_usage.window_count + 1 end,
       lifetime_count = compass_usage.lifetime_count + 1,
       updated_at = now()
     where (case when now() - compass_usage.window_start >= interval '24 hours'
                 then 0 else compass_usage.window_count end) < $2
       and compass_usage.lifetime_count < $3
     returning greatest(0, $2 - window_count) as remaining_day,
               greatest(0, $3 - lifetime_count) as remaining_lifetime`,
    [subjectHash, perDay, lifetime]
  );

  if (upsert.rows.length > 0) {
    return toState(upsert.rows[0] as never, true);
  }

  // נדחה (מכסה מוצתה): קורא את המצב הנוכחי לצורך המונה שיוצג.
  const cur = await db.query(
    `select greatest(0, $2 - case when now() - window_start >= interval '24 hours'
                                   then 0 else window_count end) as remaining_day,
            greatest(0, $3 - lifetime_count) as remaining_lifetime
       from compass_usage where subject_hash = $1`,
    [subjectHash, perDay, lifetime]
  );
  return toState(cur.rows[0] as never, false);
}

/** קריאה בלבד — כמה נותר, בלי לצרוך (להצגת המונה בטעינת העמוד). */
export async function peekQuota(db: SqlClient, subjectHash: string): Promise<QuotaState> {
  const res = await db.query(
    `select greatest(0, $2 - case when now() - window_start >= interval '24 hours'
                                   then 0 else window_count end) as remaining_day,
            greatest(0, $3 - lifetime_count) as remaining_lifetime
       from compass_usage where subject_hash = $1`,
    [subjectHash, COMPASS_LIMITS.perDay, COMPASS_LIMITS.lifetime]
  );
  const row = res.rows[0] as { remaining_day: number; remaining_lifetime: number } | undefined;
  const state = toState(row as never, true);
  return { ...state, allowed: state.remaining > 0 };
}
