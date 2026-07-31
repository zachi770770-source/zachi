import { Pool } from "pg";

import type { WaitlistRepository } from "@/lib/waitlist/types";
import { PostgresWaitlistRepository } from "@/lib/waitlist/postgresRepository";
import { InMemoryWaitlistRepository } from "@/lib/waitlist/memoryRepository";

const globalForWaitlist = globalThis as unknown as {
  waitlistPool?: Pool;
  waitlistRepo?: WaitlistRepository;
  waitlistMemoryRepo?: InMemoryWaitlistRepository;
};

/**
 * מחזיר את מאגר רשימת ההמתנה, או null כאשר אין אחסון מתמשך מחובר.
 *
 * - `DATABASE_URL` מוגדר → Postgres מתמשך (מקור האמת בפרודקשן).
 * - `WAITLIST_ALLOW_MEMORY=true` → מימוש בזיכרון, לפיתוח/בדיקות מקומיים בלבד.
 *   לעולם *לא* ב-Vercel Preview/Production: שם fallback לזיכרון היה מאבד
 *   הרשמות אמיתיות בשקט. ב-VERCEL_ENV=preview|production מתעלמים מהדגל, וכש-
 *   אין DATABASE_URL מחזירים null → ה-endpoint מחזיר 503 (כשל ברור), לא הצלחה.
 * - אחרת → null.
 *
 * הערך של DATABASE_URL אינו מודפס לעולם.
 */
export function getWaitlistRepository(): WaitlistRepository | null {
  const isVercelDeployment =
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "production";

  if (process.env.DATABASE_URL) {
    if (!globalForWaitlist.waitlistRepo) {
      if (!globalForWaitlist.waitlistPool) {
        globalForWaitlist.waitlistPool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 3,
        });
      }
      const pool = globalForWaitlist.waitlistPool;
      globalForWaitlist.waitlistRepo = new PostgresWaitlistRepository({
        query: (text, params) => pool.query(text, params),
      });
    }
    return globalForWaitlist.waitlistRepo;
  }

  if (!isVercelDeployment && process.env.WAITLIST_ALLOW_MEMORY === "true") {
    if (!globalForWaitlist.waitlistMemoryRepo) {
      globalForWaitlist.waitlistMemoryRepo = new InMemoryWaitlistRepository();
    }
    return globalForWaitlist.waitlistMemoryRepo;
  }

  return null;
}
