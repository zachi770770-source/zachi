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
    // רגרסיה בלבד. נמדד על הקורפוס המלא (382 קטעים, אינדקס קנוני): 75% לפני
    // שער-הביטחון, 73% אחריו (l05 „של מי השבת?” ו-g06 „איך מסננים בלי להיות
    // אכזרי?” אבדו). המרווח מעל הסף הצטמצם ל-2 שאלות בלבד — הידוק נוסף של
    // השער חייב להימדד כאן לפני שהוא נשקל.
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

/**
 * שער-הביטחון „I1” מול הקורפוס האמיתי.
 *
 * השער נמדד על מערך-חסימה עיוור (נכתב אחרי הקפאת האינדקס): התאמות-השווא ירדו
 * מ-14/25 ל-8/25 בלי אף אובדן recall. הבדיקות כאן מקבעות את שני הצדדים של
 * המדידה — מה חייב לשרוד, ומה חייב להיחסם — כדי שכל הידוק עתידי ייפול כאן
 * ולא בפרודקשן.
 */
describe.runIf(PG)("retrieval confidence gate (I1)", () => {
  /**
   * שאלות שחייבות להמשיך להגיע למודל: שאלת-העוגן של PR #81, שתי הפרפרזות
   * שהשתפרו בו, וארבע שאלות-הפתיחה שהאתר עצמו מציע למשתמש.
   */
  const PINNED = [
    "איך נכון להתכונן לדייט?",
    "איך מפרידים בין מה שקרה באמת לבין מה שהמצאתי בראש?",
    "אני מוותרת על עצמי בשביל שהוא יישאר",
    "אני לא יודע אם להמשיך את הקשר",
    "אנחנו רבים על אותו דבר שוב ושוב",
    "אני נמשך דווקא למי שלא באמת זמין",
    "אני אחרי פרידה ולא יודע אם לחזור",
  ];

  for (const q of PINNED) {
    it(`pinned: "${q}" still reaches the model`, async () => {
      if (!ready) return;
      const r = await searchCompass(db as never, q);
      expect(r.matched).toBe(true);
      expect(r.results.length).toBeGreaterThan(0);
    }, 60000);
  }

  /**
   * המנגנונים שהשער נבנה כדי לחסום, כפי שנצפו במערך-החסימה:
   *   A „וו יחיד” — מילה נדירה שמופיעה במקרה פעם אחת בספר.
   *   B שאריות-תחילית — אף מילה שהמשתמש כתב אינה מעוגנת.
   *   D קלט חסר-תוכן.
   */
  const REJECTED: Array<[string, string]> = [
    ["A", "כמה זמן אופים עוגת שמרים?"],
    ["A", "מה עושים נגד כאב גרון?"],
    ["A", "מה הגיל הממוצע לנישואין בישראל?"],
    ["B", "כמה כוכבים יש בגלקסיה שלנו?"],
    ["B", "מה הדרך הכי זולה לטוס לאירופה?"],
    ["D", "אני לא יודע"],
  ];

  for (const [mechanism, q] of REJECTED) {
    it(`mechanism ${mechanism}: "${q}" is refused before the model`, async () => {
      if (!ready) return;
      const r = await searchCompass(db as never, q);
      expect(r.matched).toBe(false);
      expect(r.results).toHaveLength(0);
    }, 60000);
  }
});
