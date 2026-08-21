import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

import { searchCompass } from "@/lib/compass/search";

/**
 * מערך-בדיקה לאיכות האחזור של „שאל את הספר”.
 *
 * 88 שאלות בעברית טבעית על פני 12 כוונות וכל 22 הפרקים, מתויגות לפרק/ים שבהם
 * התוכן באמת נמצא. המבנה החשוב הוא הזוגות: אותה שאלה בדיוק, פעם בניסוח של
 * הספר ופעם בעברית יומיומית. הפער בין שתי הקבוצות הוא המדד האמיתי — מערכת
 * שמשרתת רק את מי שכבר קרא את הספר אינה משרתת את מי שלא.
 *
 * המדד המרכזי אינו Recall@5 אלא „האם הפרק המצופה *הגיע למודל*”: קטע שאוחזר
 * ונחתך בבחירה אינו עוזר לאיש.
 *
 * הבדיקה מדלגת ללא `COMPASS_PG_URL` עם גרסת 888 מיובאת, ולכן אינה מכשילה CI.
 */

const BENCH = JSON.parse(
  readFileSync(resolve(process.cwd(), "src/lib/compass/__fixtures__/retrievalBenchmark.json"), "utf8"),
) as { questions: Array<{ id: string; kind: string; pair?: string; q: string; expect: number[] }> };

const PG = process.env.COMPASS_PG_URL;
let db: Client | null = null;
let ready = false;

beforeAll(async () => {
  if (!PG) return;
  db = new Client({ connectionString: PG });
  await db.connect();
  const r = await db.query(
    `select count(*) c from compass_book_sections where is_active and book_version = $1`,
    ["medaytim-laahava-888-final"],
  );
  ready = Number(r.rows[0].c) > 300;
}, 60000);

afterAll(async () => {
  await db?.end();
});

describe.runIf(PG)("retrieval quality benchmark (888)", () => {
  it("reaches the expected chapter for the great majority of questions", async () => {
    if (!ready) return;
    const answerable = BENCH.questions.filter((q) => q.expect.length > 0);
    let reached = 0;
    const missed: string[] = [];
    for (const q of answerable) {
      const r = await searchCompass(db as never, q.q);
      if (r.results.some((m) => q.expect.includes(m.chapterNumber))) reached++;
      else missed.push(`${q.id} "${q.q}"`);
    }
    const ratio = reached / answerable.length;
    console.log(`reaches model: ${reached}/${answerable.length} = ${(100 * ratio).toFixed(0)}%`);
    missed.forEach((m) => console.log(`  miss ${m}`));
    // רגרסיה בלבד: נמדד 74% אחרי שלב 1. הסף שמור מתחת, כדי שהבדיקה תיפול על
    // נסיגה אמיתית ולא על רעש.
    expect(ratio).toBeGreaterThanOrEqual(0.7);
  }, 300000);

  it("keeps questions the book does not answer unanswered", async () => {
    if (!ready) return;
    const un = BENCH.questions.filter((q) => q.expect.length === 0);
    let matched = 0;
    for (const q of un) {
      const r = await searchCompass(db as never, q.q);
      if (r.matched) { matched++; console.log(`  false match: "${q.q}"`); }
    }
    console.log(`false matches: ${matched}/${un.length}`);
    // נמדד 3/8 אחרי שלב 1 (מול 4/8 לפני). הסף מונע החמרה.
    expect(matched).toBeLessThanOrEqual(3);
  }, 120000);

  it("the canary question reaches the section that actually answers it", async () => {
    if (!ready) return;
    const r = await searchCompass(db as never, "איך נכון להתכונן לדייט?");
    const hasInstruction = r.results.some((m) =>
      /לפני הדייט, דבר אחד|שני דברים קטנים/.test(m.content),
    );
    expect(r.matched).toBe(true);
    expect(hasInstruction).toBe(true);
  }, 60000);
});
