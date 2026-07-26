import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Pool } from "pg";

vi.mock("server-only", () => ({}));

import { ensureQuotaSchema, consumeQuota, refundQuota, peekQuota } from "@/lib/compass/assistant/quota";
import { hashSubject } from "@/lib/compass/assistant/identity";
import { COMPASS_LIMITS } from "@/lib/compass/assistant/config";
import type { SqlClient } from "@/lib/compass/types";

/**
 * בדיקת אינטגרציה אמיתית של המכסה מול PostgreSQL. רצה רק כאשר COMPASS_PG_URL
 * מוגדר (למשל Postgres מקומי). מוכיחה: 3/24h, 7 מצטבר, איפוס חלון אחרי 24h,
 * ושרענון (peek) אינו צורך ואינו מאפס.
 */
const PG_URL = process.env.COMPASS_PG_URL;
const run = PG_URL ? describe : describe.skip;

run("compass quota (integration)", () => {
  let pool: Pool;
  let db: SqlClient;

  beforeAll(async () => {
    pool = new Pool({ connectionString: PG_URL, max: 3 });
    db = { query: (t, p) => pool.query(t, p) };
    await pool.query(`drop table if exists compass_usage`);
    await ensureQuotaSchema(db);
  });

  afterAll(async () => {
    await pool.query(`drop table if exists compass_usage`).catch(() => {});
    await pool.end();
  });

  const setWindowStale = (hash: string) =>
    pool.query(`update compass_usage set window_start = now() - interval '25 hours' where subject_hash = $1`, [hash]);

  it("אוכף 3 שאלות ב-24 שעות", async () => {
    const h = hashSubject("subject-A");
    const r1 = await consumeQuota(db, h);
    const r2 = await consumeQuota(db, h);
    const r3 = await consumeQuota(db, h);
    expect([r1.allowed, r2.allowed, r3.allowed]).toEqual([true, true, true]);
    expect(r3.remainingDay).toBe(0);
    const r4 = await consumeQuota(db, h);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("חלון היממה מתאפס אחרי 24h, אך המכסה המצטברת (7) נשמרת", async () => {
    const h = hashSubject("subject-B");
    // 6 שאלות = פעמיים 3, עם איפוס חלון ביניהן.
    for (let round = 0; round < 2; round++) {
      await consumeQuota(db, h);
      await consumeQuota(db, h);
      const last = await consumeQuota(db, h);
      expect(last.allowed).toBe(true);
      await setWindowStale(h); // „עברו 24 שעות”
    }
    // אחרי 6: נותרה 1 מצטברת. חלון טרי → מותר עוד אחת (השביעית).
    const seventh = await consumeQuota(db, h);
    expect(seventh.allowed).toBe(true);
    expect(seventh.remainingLifetime).toBe(0);
    // גם עם חלון טרי, המצטברת מוצתה → נדחה.
    await setWindowStale(h);
    const eighth = await consumeQuota(db, h);
    expect(eighth.allowed).toBe(false);
  });

  it("רענון (peek) אינו צורך ואינו מאפס", async () => {
    const h = hashSubject("subject-C");
    await consumeQuota(db, h); // 1 שימוש
    const p1 = await peekQuota(db, h);
    const p2 = await peekQuota(db, h);
    expect(p1.remaining).toBe(p2.remaining); // peek לא משנה כלום
    expect(p1.remainingDay).toBe(2);
    expect(p1.remainingLifetime).toBe(6);
    const c = await consumeQuota(db, h); // צריכה אמיתית ממשיכה מהמצב
    expect(c.remainingDay).toBe(1);
  });

  it("אטומי תחת בקשות מקבילות — אין עקיפה במקביליות", async () => {
    const h = hashSubject("subject-parallel");
    const attempts = COMPASS_LIMITS.perDay + 5; // הרבה יותר מהתקרה
    const results = await Promise.all(
      Array.from({ length: attempts }, () => consumeQuota(db, h))
    );
    const allowed = results.filter((r) => r.allowed).length;
    // בדיוק perDay שמורות מצליחות, גם כשכולן רצות במקביל.
    expect(allowed).toBe(COMPASS_LIMITS.perDay);
    const dbCount = await pool.query(
      `select window_count, lifetime_count from compass_usage where subject_hash = $1`,
      [h]
    );
    expect(Number(dbCount.rows[0].window_count)).toBe(COMPASS_LIMITS.perDay);
    expect(Number(dbCount.rows[0].lifetime_count)).toBe(COMPASS_LIMITS.perDay);
  });

  it("refund מחזיר שמורה שלא הבשילה לתשובה, בלי לרדת מתחת ל-0", async () => {
    const h = hashSubject("subject-refund");
    await consumeQuota(db, h); // window=1, lifetime=1
    const back = await refundQuota(db, h); // → window=0, lifetime=0
    expect(back.remainingDay).toBe(COMPASS_LIMITS.perDay);
    expect(back.remainingLifetime).toBe(COMPASS_LIMITS.lifetime);
    const again = await refundQuota(db, h); // לא יורד מתחת ל-0
    expect(again.remainingLifetime).toBe(COMPASS_LIMITS.lifetime);
    const dbRow = await pool.query(
      `select window_count, lifetime_count from compass_usage where subject_hash = $1`,
      [h]
    );
    expect(Number(dbRow.rows[0].window_count)).toBe(0);
    expect(Number(dbRow.rows[0].lifetime_count)).toBe(0);
  });
});
