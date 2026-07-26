import "server-only";

import { Pool } from "pg";

import type { SqlClient } from "@/lib/compass/types";

/**
 * חיבור מסד הנתונים לעוזר „המצפן” — בצד השרת בלבד, דרך DATABASE_URL.
 * מחזיר null כאשר אין DATABASE_URL, כדי שהראוט יחזיר „לא זמין” ולעולם לא
 * תוכן פיקצ׳ר. הערך של DATABASE_URL אינו מודפס לעולם.
 */

const globalForCompassDb = globalThis as unknown as {
  compassPool?: Pool;
  compassDb?: SqlClient | null;
};

export function getCompassDb(): SqlClient | null {
  if (globalForCompassDb.compassDb !== undefined) return globalForCompassDb.compassDb;
  if (!process.env.DATABASE_URL) {
    globalForCompassDb.compassDb = null;
    return null;
  }
  if (!globalForCompassDb.compassPool) {
    globalForCompassDb.compassPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
    });
  }
  const pool = globalForCompassDb.compassPool;
  globalForCompassDb.compassDb = {
    query: (text, params) => pool.query(text, params),
  };
  return globalForCompassDb.compassDb;
}
