import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool, type PoolClient } from "pg";

import { ensureCompassSchema } from "@/lib/compass/schema";
import {
  importVersion,
  activateVersion,
  deactivateVersion,
} from "@/lib/compass/importer";
import { searchCompass } from "@/lib/compass/search";
import { sampleBook } from "@/lib/compass/__fixtures__/sampleBook";

/**
 * בדיקות אינטגרציה מול PostgreSQL אמיתי (FTS). רצות רק כאשר COMPASS_PG_URL
 * מוגדר, כדי לאמת בפועל את הדירוג הממושקל, הסירוב בהתאמה נמוכה, מניעת
 * החזרת פרק שלם, וההפרדה בין גרסאות.
 */
const URL = process.env.COMPASS_PG_URL;
const suite = URL ? describe : describe.skip;

suite("compass knowledge layer (real Postgres)", () => {
  let pool: Pool;
  let client: PoolClient;

  beforeAll(async () => {
    pool = new Pool({ connectionString: URL, max: 3 });
    client = await pool.connect();
    await client.query("drop table if exists compass_book_sections cascade");
    await client.query("drop table if exists compass_book_versions cascade");
    await ensureCompassSchema(client);
    await importVersion(client, sampleBook);
    await activateVersion(client, sampleBook.version);
  });

  afterAll(async () => {
    client?.release();
    await pool?.end();
  });

  it("1. clear source → returns relevant sections with a chapter name", async () => {
    const r = await searchCompass(pool, "בדיקת השקט בקשר");
    expect(r.matched).toBe(true);
    expect(r.results.length).toBeGreaterThanOrEqual(1);
    expect(r.results.length).toBeLessThanOrEqual(5);
    expect(r.results[0].chapterName).toBeTruthy();
    expect(r.results.some((x) => x.chapterName.includes("השער"))).toBe(true);
  });

  it("2. no source → refuses with no content", async () => {
    const r = await searchCompass(pool, "מתכון לעוגת שוקולד עם ריבת חלב");
    expect(r.matched).toBe(false);
    expect(r.results).toHaveLength(0);
  });

  it("3. too-general question → bounded, never the whole book", async () => {
    const r = await searchCompass(pool, "קשר");
    expect(r.results.length).toBeLessThanOrEqual(5);
  });

  it("4. full-chapter request → cannot dump a chapter (<=2 sections/chapter)", async () => {
    const r = await searchCompass(pool, "רעש הקשבה בנייה בדיקה קשר אהבה שקט");
    const perChapter = new Map<number, number>();
    for (const x of r.results) {
      perChapter.set(x.chapterNumber, (perChapter.get(x.chapterNumber) ?? 0) + 1);
    }
    for (const n of perChapter.values()) expect(n).toBeLessThanOrEqual(2);
    expect(r.results.length).toBeLessThanOrEqual(5);
  });

  it("5. no sequential traversal → search is query-driven and capped", async () => {
    // אין ממשק "החזר הכול"; אפילו שאילתה רחבה מוגבלת ל-5 קטעים.
    const r = await searchCompass(pool, "קשר אהבה רעש שער בנייה");
    expect(r.results.length).toBeLessThanOrEqual(5);
  });

  it("6. inactive version → refuses", async () => {
    await deactivateVersion(client, sampleBook.version);
    const r = await searchCompass(pool, "בדיקת השקט");
    expect(r.matched).toBe(false);
    await activateVersion(client, sampleBook.version); // שחזור
  });

  it("7. version switch keeps exactly one active version (no mixing)", async () => {
    const v2 = { ...sampleBook, version: "fixture-v2" };
    await importVersion(client, v2);
    await activateVersion(client, "fixture-v2");
    const r = await searchCompass(pool, "בדיקת השקט");
    expect(r.matched).toBe(true);
    expect(r.bookVersion).toBe("fixture-v2");
    const active = await client.query(
      "select count(*)::int as n from compass_book_versions where status='active'"
    );
    expect((active.rows[0] as { n: number }).n).toBe(1);
  });

  it("8. no full-content exposure → weak match yields empty results", async () => {
    const r = await searchCompass(pool, "אקראי בלתי קשור כלשהו", { minScore: 0.9 });
    expect(r.matched).toBe(false);
    expect(r.results).toHaveLength(0);
  });
});
