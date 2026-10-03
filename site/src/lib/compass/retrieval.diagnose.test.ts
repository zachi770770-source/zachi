/**
 * אבחון-אחזור לקריאה בלבד ל„שאל את הספר”, מול הספר המיובא האמיתי.
 *
 * הרצה (GitHub Actions בלבד, workflow_dispatch — ראו
 * .github/workflows/compass-diagnose.yml):
 *   COMPASS_PG_URL_READONLY=… COMPASS_DIAGNOSE_OUT=out.json \
 *     npx vitest run src/lib/compass/retrieval.diagnose.test.ts
 * מדלג בשקט בלי COMPASS_PG_URL_READONLY, ולכן אינו משפיע על CI.
 *
 * בטיחות:
 *   • קריאה בלבד: כל העבודה רצה בתוך `begin transaction read only`, והחיבור
 *     נפתח עם default_transaction_read_only=on. אין INSERT/UPDATE/DELETE/DDL;
 *     כל ניסיון כתיבה ייכשל במסד עצמו.
 *   • אין הדפסה של מחרוזת החיבור, ואין הדפסה של גוף הספר. הפלט מכיל רק: מונחי
 *     שאילתה, החלטות-שער, מזהי קטעים (id), מספרי פרק, שמות פרק/סעיף (כותרות),
 *     ציונים ומדדי-benchmark.
 */
import { describe, it, vi } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { Client } from "pg";

vi.mock("server-only", () => ({}));

import { searchCompass, splitQueryTerms, gateDerivedTerms } from "@/lib/compass/search";
import { requiredBookVersion } from "@/lib/compass/assistant/config";

const PRACTICAL_QUESTIONS = [
  "מי משלם בדייט ראשון?",
  "האם גבר צריך לשלם בדייט?",
  "היא לא הציעה להתחלק בחשבון, מה זה אומר?",
  "הוא הציע שנתחלק, האם זה אומר שהוא לא רציני?",
  "האם נתינה בדייט אומרת משהו על הקשר?",
];

/**
 * מושגים לבדיקת קיום בספר. כל מושג מוגדר כביטוי רגולרי על התוכן הגולמי
 * (`content`), כדי לא להיות תלוי בנרמול שנבדק. התוצאה היא מזהים וכותרות בלבד.
 * זו *בדיקה* אם המושג קיים בספר, לא מיפוי שנכנס לאחזור.
 */
const CONCEPTS: Record<string, string> = {
  "ציפיות": "ציפי(ה|ות|יה|יות)|מצפ(ה|ים|ות|ית)|לצפות",
  "נתינה": "נתינה|לתת|נותנ(ת|ים|ות)?|נותן|נתנ(ו|ה)?|מעניק",
  "הדדיות": "הדדי(ת|ות|ים)?",
  "פירוש התנהגות / מחוות": "מחוו(ה|ות)|פירוש|פרשנות|מפרש(ים|ת|ות)?|לפרש",
  "נדיבות": "נדיב(ות|ה|ים)?",
  "גבולות": "גבול(ות)?|גבולותי",
  "כסף / תשלום": "כסף|תשלומ?|משלמ|לשלמ|שילמ|חשבונ|להתחלק",
};

type Section = {
  id: string;
  chapter_number: number;
  chapter_name: string;
  section_name: string | null;
};

const URL_RO = process.env.COMPASS_PG_URL_READONLY;

async function main(url: string) {
  const out = process.env.COMPASS_DIAGNOSE_OUT ?? "compass-diagnose.json";

  const db = new Client({
    connectionString: url,
    // שכבת הגנה שנייה: גם בלי ה-begin, כל טרנזקציה בחיבור היא לקריאה בלבד.
    options: "-c default_transaction_read_only=on -c statement_timeout=30000",
  });
  await db.connect();
  await db.query("begin transaction read only");

  try {
    const version = requiredBookVersion();
    const active = await db.query(
      `select version from compass_book_versions where status = 'active' limit 1`,
    );
    const activeVersion = (active.rows[0]?.version as string | undefined) ?? null;
    const total = Number(
      (
        await db.query(
          `select count(*) c from compass_book_sections where is_active and book_version = $1`,
          [version],
        )
      ).rows[0].c,
    );

    const idOf = async (m: { chapterNumber: number; sectionName: string | null; content: string }) => {
      const r = await db.query(
        `select id from compass_book_sections
          where is_active and book_version = $1 and chapter_number = $2
            and section_name is not distinct from $3 and content = $4
          limit 1`,
        [version, m.chapterNumber, m.sectionName, m.content],
      );
      return (r.rows[0]?.id as string | undefined) ?? null;
    };

    // ── מושגים: האם קיימים בספר, ואיפה ──────────────────────────────────────
    const concepts: Record<string, { count: number; sections: Section[] }> = {};
    for (const [name, re] of Object.entries(CONCEPTS)) {
      const r = await db.query(
        `select id, chapter_number, chapter_name, section_name
           from compass_book_sections
          where is_active and book_version = $1 and content ~ $2
          order by chapter_number, section_order`,
        [version, re],
      );
      concepts[name] = { count: r.rowCount ?? 0, sections: r.rows as Section[] };
    }
    const conceptIds = new Map<string, string[]>();
    for (const [name, c] of Object.entries(concepts)) {
      for (const s of c.sections) conceptIds.set(s.id, [...(conceptIds.get(s.id) ?? []), name]);
    }

    // ── שאלה אחת: כל השלבים ──────────────────────────────────────────────────
    const diagnose = async (q: string) => {
      const { original, derived } = splitQueryTerms(q);
      const terms = [...new Set([...original, ...derived])];
      const dfRows = terms.length
        ? (
            await db.query(
              `select t, (select count(*) from compass_book_sections s
                           where s.is_active and s.book_version = $2
                             and s.search_tsv @@ to_tsquery('simple', t)) as df
                 from unnest($1::text[]) t`,
              [terms, version],
            )
          ).rows
        : [];
      const df = new Map<string, number>(dfRows.map((r) => [r.t as string, Number(r.df)]));
      const kept = gateDerivedTerms(original, derived, df, total);
      const dropped = derived.filter((t) => !kept.includes(t));

      // 20 המועמדים הגולמיים *לפני* השער: כל המונחים, מקוריים ונגזרים.
      const ungated = terms.join(" | ");
      const raw = ungated
        ? (
            await db.query(
              `select id, chapter_number, chapter_name, section_name,
                      ts_rank_cd(search_tsv, query, 32) as score
                 from compass_book_sections, to_tsquery('simple', $1) query
                where book_version = $2 and is_active and search_tsv @@ query
                order by score desc limit 20`,
              [ungated, version],
            )
          ).rows
        : [];

      // התוצאה הסופית בדיוק כמו בפרודקשן (שער + סף + דירוג-מחדש).
      const final = await searchCompass(db as never, q);
      const finalRows = [];
      for (const m of final.results) {
        finalRows.push({
          id: await idOf(m),
          chapter: m.chapterNumber,
          chapterName: m.chapterName,
          section: m.sectionName,
          score: m.score,
        });
      }

      const reached = new Set(raw.map((r) => String(r.id)));
      const finalIds = new Set(finalRows.map((r) => String(r.id)));
      const conceptMisses = [...conceptIds.entries()]
        .filter(([id]) => !finalIds.has(id))
        .map(([id, names]) => ({ id, concepts: names, inRawTop20: reached.has(id) }));

      return {
        question: q,
        original,
        derived,
        df: Object.fromEntries(df),
        gateKept: kept,
        gateDropped: dropped,
        rawTop20: raw.map((r, i) => ({
          rank: i + 1,
          id: String(r.id),
          chapter: r.chapter_number,
          chapterName: r.chapter_name,
          section: r.section_name,
          score: Number(Number(r.score).toFixed(4)),
          concepts: conceptIds.get(String(r.id)) ?? [],
        })),
        matched: final.matched,
        final: finalRows.map((r) => ({ ...r, concepts: conceptIds.get(String(r.id)) ?? [] })),
        conceptSectionsNotInFinal: conceptMisses,
      };
    };

    const practical = [];
    for (const q of PRACTICAL_QUESTIONS) practical.push(await diagnose(q));

    // ── benchmark מלא (אותו קובץ כמו retrieval.bench.test.ts) ──────────────────
    // לכל שאלה: מונחי השאילתה, הקטעים הסופיים (מזהים, פרקים וציונים — להשוואת
    // מועמדים בין גרסאות), והדרגה של הקטע הראשון מהפרק המצופה (gold rank, 1..5
    // או null). „unanswerable” היא קבוצת השלילה.
    const bench = JSON.parse(
      readFileSync(resolve(process.cwd(), "src/lib/compass/__fixtures__/retrievalBenchmark.json"), "utf8"),
    ) as { questions: Array<{ id: string; kind: string; q: string; expect: number[] }> };
    type BenchRow = {
      id: string;
      kind: string;
      expect: number[];
      original: string[];
      derived: string[];
      matched: boolean;
      finalIds: Array<string | null>;
      chapters: number[];
      scores: number[];
      goldRank: number | null;
      falseMatch: boolean | null;
    };
    const benchRows: BenchRow[] = [];
    for (const b of bench.questions) {
      const r = await searchCompass(db as never, b.q);
      const finalIds: Array<string | null> = [];
      for (const m of r.results) finalIds.push(await idOf(m));
      const chapters = r.results.map((m) => m.chapterNumber);
      const idx = chapters.findIndex((c) => b.expect.includes(c));
      const { original, derived } = splitQueryTerms(b.q);
      benchRows.push({
        id: b.id,
        kind: b.kind,
        expect: b.expect,
        original,
        derived,
        matched: r.matched,
        finalIds,
        chapters,
        scores: r.results.map((m) => m.score),
        goldRank: b.expect.length > 0 && idx >= 0 ? idx + 1 : null,
        falseMatch: b.expect.length === 0 ? r.matched : null,
      });
    }
    const metricsFor = (rows: BenchRow[]) => {
      const n = rows.length || 1;
      const hit = (k: number) => rows.filter((r) => r.goldRank !== null && r.goldRank <= k).length;
      return {
        n: rows.length,
        hit1: hit(1),
        hit3: hit(3),
        hit5: hit(5),
        mrr: Number((rows.reduce((a, r) => a + (r.goldRank ? 1 / r.goldRank : 0), 0) / n).toFixed(4)),
      };
    };
    const answerable = benchRows.filter((r) => r.expect.length > 0);
    const unanswerable = benchRows.filter((r) => r.expect.length === 0);
    const byKind: Record<string, ReturnType<typeof metricsFor>> = {};
    for (const k of [...new Set(answerable.map((r) => r.kind))]) {
      byKind[k] = metricsFor(answerable.filter((r) => r.kind === k));
    }
    const metrics = {
      answerable: metricsFor(answerable),
      byKind,
      negative: { n: unanswerable.length, falseMatches: unanswerable.filter((r) => r.falseMatch).length },
    };

    const report = {
      requiredVersion: version,
      activeVersion,
      activeSections: total,
      concepts,
      practical,
      benchmark: { metrics, rows: benchRows },
    };
    writeFileSync(out, JSON.stringify(report, null, 2));

    // סיכום קצר ללוג (ללא תוכן הספר).
    console.log(`active=${activeVersion} required=${version} sections=${total}`);
    for (const [name, c] of Object.entries(concepts)) console.log(`concept ${name}: ${c.count} sections`);
    for (const p of practical) {
      console.log(
        `\n${p.question}\n  original=${p.original.join(",")} derived=${p.derived.join(",")} dropped=${p.gateDropped.join(",") || "-"}` +
          `\n  matched=${p.matched} final=${p.final.map((f) => `${f.id}(ch${f.chapter},${f.score}${f.concepts.length ? ",*" + f.concepts.join("/") : ""})`).join(" ") || "-"}`,
      );
    }
    console.log(
      `\nbenchmark: ${JSON.stringify(metrics.answerable)} negative=${JSON.stringify(metrics.negative)}`,
    );
  } finally {
    await db.query("rollback").catch(() => {});
    await db.end();
  }
}

describe.runIf(URL_RO)("compass retrieval diagnostic (read-only, real corpus)", () => {
  it("writes the diagnostic report", async () => {
    try {
      await main(URL_RO as string);
    } catch (e) {
      // שם השגיאה וההודעה בלבד, בלי stack (שעלול להכיל פרטי חיבור).
      throw new Error(
        `compass-diagnose failed: ${(e as Error)?.name ?? "Error"}: ${(e as Error)?.message ?? ""}`.replace(
          /postgres(ql)?:\/\/\S+/g,
          "[redacted]",
        ),
      );
    }
  }, 600000);
});
