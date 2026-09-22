import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Client } from "pg";

vi.mock("server-only", () => ({}));

import { importVersion, activateVersion } from "@/lib/compass/importer";
import { searchCompass, splitQueryTerms, gateDerivedTerms } from "@/lib/compass/search";
import { diagnosticCorpus } from "@/lib/compass/__fixtures__/diagnosticCorpus";

/**
 * שחזור דטרמיניסטי של תקלת-אחזור שדווחה מהשטח, על קורפוס **סינתטי** שאפשר
 * לשלוט בו במלואו (ראו `__fixtures__/diagnosticCorpus.ts` — אינו כתב-היד).
 *
 * השאלה: „בדייט ראשון מי אמור לשלם, הגבר או האישה?”
 *
 * הבדיקה מקבעת שלושה כשלים נפרדים שאובחנו, כדי שיהיו מדידים ולא ידע
 * שבעל-פה. **אלה בדיקות-אפיון**: הן מתעדות את המצב הקיים. כשייכנס תיקון,
 * הציפיות המסומנות „יתהפך עם התיקון” אמורות להשתנות — וזה הסימן שהתיקון עבד.
 *
 * למה קורפוס סינתטי: כתב-היד אינו במאגר (וכך צריך להיות), ולכן אי-אפשר
 * להסיק כאן שום דבר על *תוכן הספר*. מה שכן מוכח כאן הוא ה**מנגנון** — והוא
 * זהה בכל קורפוס בעל אותן תכונות מבניות.
 */

const PG = process.env.COMPASS_PG_URL;
const VERSION = diagnosticCorpus.version;
const REPORTED_QUESTION = "בדייט ראשון מי אמור לשלם, הגבר או האישה?";

let db: Client;

describe.runIf(PG)("Ask-the-Book retrieval diagnostics (synthetic corpus)", () => {
  beforeAll(async () => {
    db = new Client({ connectionString: PG });
    await db.connect();
    await importVersion(db as never, diagnosticCorpus);
    await activateVersion(db as never, VERSION);
  }, 60_000);

  afterAll(async () => {
    await db?.end();
  });

  const corpusSize = async () =>
    Number(
      (
        await db.query(
          `select count(*) c from compass_book_sections where is_active and book_version = $1`,
          [VERSION],
        )
      ).rows[0].c,
    );

  const df = async (term: string) =>
    Number(
      (
        await db.query(
          `select count(*) c from compass_book_sections
            where is_active and book_version = $1 and search_tsv @@ to_tsquery('simple', $2)`,
          [VERSION, term],
        )
      ).rows[0].c,
    );

  it("כשל 1: „דייט” מסווג כנגזר ומסונן החוצה כגנרי, למרות שהמשתמש כתב אותו", async () => {
    const { original, derived } = splitQueryTerms(REPORTED_QUESTION);

    // המשתמש כתב „בדייט”. מכיוון שהתחילית ב' נחתכת, „דייט” — המונח הנושאי
    // המרכזי בשאלה — נחשב *נגזר*, כלומר ראיה מדרגה שנייה.
    expect(original).toContain("בדייט");
    expect(derived).toContain("דייט");

    const total = await corpusSize();
    const dfMap = new Map<string, number>();
    for (const t of [...original, ...derived]) dfMap.set(t, await df(t));

    // בספר על דייטינג „דייט” נפוץ מעצם הנושא, ולכן חוצה את סף-הגנריות (20%).
    expect(dfMap.get("דייט")! / total).toBeGreaterThan(0.2);

    const kept = gateDerivedTerms(original, derived, dfMap, total);
    // יתהפך עם התיקון: כרגע המונח הנושאי המרכזי נזרק.
    expect(kept).not.toContain("דייט");

    // השער מופעל כי *מונח מקורי כלשהו* מאומת — אך המונחים שאימתו אותו אינם
    // נושאיים כלל. זו החולשה: „מאומת” אינו „אינפורמטיבי”.
    expect(original.some((t) => (dfMap.get(t) ?? 0) > 0)).toBe(true);
  });

  it("כשל 2: קטעי-העקרונות שיכולים לבסס תשובה אינם מגיעים למודל", async () => {
    // הקורפוס הסינתטי *כן* מכיל חומר רלוונטי לשאלת התשלום — הדדיות, נתינה,
    // מחוות, ציפיות — אבל בלי המילים „משלם/תשלום/חשבון/כסף”.
    expect(await df("הדדיות")).toBeGreaterThan(0);
    expect(await df("נתינה")).toBeGreaterThan(0);
    expect(await df("מחווה")).toBeGreaterThan(0);

    const res = await searchCompass(db as never, REPORTED_QUESTION);
    const sections = res.results.map((r) => r.sectionName);

    // יתהפך עם התיקון: אלה בדיוק הקטעים שתשובה מבוססת-עקרונות הייתה נשענת
    // עליהם, והם אינם נשלחים למודל.
    expect(sections).not.toContain("הדדיות לאורך זמן");
    expect(sections).not.toContain("מחוות בתחילת קשר");
    expect(sections).not.toContain("נתינה מתוך בחירה");
  });

  it("כשל 3: גם התאמה מורפולוגית ישירה מוחמצת — „לשלם” אינו מגיע ל„תשלום”", async () => {
    // הקטע «נתינה מתוך בחירה» מכיל „תשלום” מפורשות, והשאלה מכילה „לשלם”.
    const withTashlum = await db.query(
      `select section_name from compass_book_sections
        where is_active and book_version = $1 and search_tsv @@ to_tsquery('simple', $2)`,
      [VERSION, "תשלומ"],
    );
    expect((withTashlum.rows as Array<{ section_name: string }>).map((r) => r.section_name)).toContain(
      "נתינה מתוך בחירה",
    );

    const res = await searchCompass(db as never, REPORTED_QUESTION);
    // יתהפך עם התיקון.
    expect(res.results.map((r) => r.sectionName)).not.toContain("נתינה מתוך בחירה");
  });

  it("הגנת-דיוק שאסור לשבור: שאלה מחוץ-לספר אינה מקבלת תוכן", async () => {
    // התיקון לכשלים למעלה חייב *לא* להפוך את השער לפרוץ. הבדיקה הזו היא
    // הצד השני של המשוואה, והיא אמורה להישאר ירוקה גם אחרי כל שיפור recall.
    for (const q of [
      "מה מזג האוויר מחר בתל אביב?",
      "כמה עולה טיסה ליוון בקיץ?",
      "מה מתכון טוב לשקשוקה?",
    ]) {
      const res = await searchCompass(db as never, q);
      expect(res.results, `out-of-scope question leaked content: ${q}`).toEqual([]);
      expect(res.matched).toBe(false);
    }
  });
});
