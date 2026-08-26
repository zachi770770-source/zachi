import { Pool } from "pg";

import type { ReaderAccessRepository } from "@/lib/reader/types";
import { PostgresReaderAccessRepository } from "@/lib/reader/postgresRepository";
import { InMemoryReaderAccessRepository } from "@/lib/reader/memoryRepository";

const globalForReader = globalThis as unknown as {
  readerPool?: Pool;
  readerRepo?: ReaderAccessRepository;
  readerMemoryRepo?: InMemoryReaderAccessRepository;
};

/**
 * מחזיר את מאגר גישת ערכת-הקורא, או null כשאין אחסון מתמשך מחובר.
 *
 * - `DATABASE_URL` מוגדר → Postgres מתמשך (מקור-האמת בפרודקשן; מאגר משותף
 *   עם רשימת ההמתנה, טבלה נפרדת).
 * - `READER_ALLOW_MEMORY=true` → זיכרון, לפיתוח/בדיקות בלבד; מתעלמים ממנו
 *   ב-Vercel Preview/Production כדי לא לאבד הפעלות בשקט (→ null → 503 ברור).
 * - אחרת → null.
 *
 * ערך DATABASE_URL אינו מודפס לעולם.
 */
export function getReaderAccessRepository(): ReaderAccessRepository | null {
  const isVercelDeployment =
    process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production";

  if (process.env.DATABASE_URL) {
    if (!globalForReader.readerRepo) {
      if (!globalForReader.readerPool) {
        globalForReader.readerPool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 3,
        });
      }
      const pool = globalForReader.readerPool;
      globalForReader.readerRepo = new PostgresReaderAccessRepository({
        query: (text, params) => pool.query(text, params),
      });
    }
    return globalForReader.readerRepo;
  }

  if (!isVercelDeployment && process.env.READER_ALLOW_MEMORY === "true") {
    if (!globalForReader.readerMemoryRepo) {
      globalForReader.readerMemoryRepo = new InMemoryReaderAccessRepository();
    }
    return globalForReader.readerMemoryRepo;
  }

  return null;
}
