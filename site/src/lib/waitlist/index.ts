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
 * - `WAITLIST_ALLOW_MEMORY=true` → מימוש בזיכרון, לבדיקות בלבד.
 * - אחרת → null. ה-endpoint יחזיר 503 ולא ידווח על הצלחה פיקטיבית.
 *
 * הערך של DATABASE_URL אינו מודפס לעולם.
 */
export function getWaitlistRepository(): WaitlistRepository | null {
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

  if (process.env.WAITLIST_ALLOW_MEMORY === "true") {
    if (!globalForWaitlist.waitlistMemoryRepo) {
      globalForWaitlist.waitlistMemoryRepo = new InMemoryWaitlistRepository();
    }
    return globalForWaitlist.waitlistMemoryRepo;
  }

  return null;
}
