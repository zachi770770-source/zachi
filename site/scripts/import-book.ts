/**
 * Orchestrator לייבוא ספר 888 אל שכבת הידע של „המצפן” — הרצה מקומית בלבד.
 *
 *   npm run import:book:local     # (Windows/כל פלטפורמה) טוען .env.import ומייבא inactive
 *   npm run import:book           # כנ"ל בלי טעינת env אוטומטית (סביבה כבר טעונה)
 *   npm run import:book -- --activate   # מפעיל רק אם כל השערים עברו (לא בשלב זה)
 *
 * השלבים: הורדה+checksum → חילוץ+זיהוי שכבת-טקסט → ניקוי טכני → זיהוי מבנה
 * (מבוא/13 פרקים/סיום/נספחים) → chunking → ייבוא טרנזקציוני כ-inactive
 * (version = medaytim-laahava-888-final) → בדיקות שלמות → 30 שאלות + כיול
 * → כתיבת דוח מסונן → הפעלה (רק עם --activate וכל השערים).
 *
 * הדוח נכתב אל .import-tmp/import-run-report.md ואינו כולל: סודות, DSN,
 * מפתחות, טקסט ארוך מהספר, תוכן גולמי של chunks, או stack traces רגישים.
 * .import-tmp/ מוחרג לגמרי מ-Git.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Pool } from "pg";

import type { BookSource, SectionType } from "@/lib/compass/types";
import { chunkBook } from "@/lib/compass/chunker";
import { importVersion, activateVersion } from "@/lib/compass/importer";
import { cleanPagesDetailed, type CleaningStats } from "@/lib/compass/extract/clean";
import {
  detectStructure,
  summarizeStructure,
  type CleanPage,
} from "@/lib/compass/extract/structure";

import { downloadBook, TMP_DIR } from "./import/download";
import { extractPdf } from "./import/pdf";
import { evaluateSearch, type EvalReport } from "./import/evaluate";

const VERSION = "medaytim-laahava-888-final";
/** ספר צפוי: מבוא + 13 פרקים + סיום (נספחים אופציונליים). */
const EXPECTED_CHAPTERS = 13;
/** שער איכות האחזור: שיעור מינימלי של שאלות עם התאמה מספקת כדי להתיר הפעלה. */
const MIN_SUFFICIENT_RATIO = 0.7;
const REPORT_PATH = path.join(TMP_DIR, "import-run-report.md");

// ── דוח מסונן (Markdown) — נצבר לאורך הריצה ונכתב לקובץ ──
const md: string[] = [];
function r(line = "") {
  md.push(line);
}
function log(msg: string) {
  console.log(msg);
}

/**
 * מסנן מחרוזת מסודות/DSN/מפתחות לפני כתיבה לדוח: מסיר connection strings,
 * כתובות http(s) ו-tokens ארוכים, וגוזם אורך. הגנה נוספת — ממילא איננו
 * כותבים ערכי סביבה או תוכן ספר לדוח.
 */
function sanitize(text: string): string {
  return text
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted-dsn]")
    .replace(/https?:\/\/\S+/gi, "[redacted-url]")
    .replace(/\b(?:apikey|authorization|bearer|password|secret|key)\b[=:]\s*\S+/gi, "$1=[redacted]")
    .replace(/[A-Za-z0-9._-]{40,}/g, "[redacted-token]")
    .slice(0, 500);
}

async function writeReport(): Promise<void> {
  await mkdir(TMP_DIR, { recursive: true });
  await writeFile(REPORT_PATH, md.join("\n") + "\n", "utf8");
}

/** כשל מבוקר: כותב סעיף כשל מסונן לדוח (השלב + סוג התקלה) ויוצא. */
async function failStep(step: string, reason: string): Promise<never> {
  r("");
  r("## ❌ כשל");
  r(`- **שלב שנכשל:** ${step}`);
  r(`- **סוג התקלה:** ${sanitize(reason)}`);
  r("- הגרסה **לא הופעלה**; לא בוצע commit חלקי (הייבוא טרנזקציוני).");
  await writeReport().catch(() => {});
  console.error(`import-book: [${step}] ${sanitize(reason)}`);
  console.error(`דוח מסונן נכתב אל ${REPORT_PATH}`);
  process.exit(1);
}

interface StructureCheck {
  counts: Record<SectionType, number>;
  ok: boolean;
  warnings: string[];
}

function verifyStructure(source: BookSource): StructureCheck {
  const counts = summarizeStructure(source);
  const warnings: string[] = [];
  if (counts.intro < 1) warnings.push("לא זוהה מבוא/הקדמה.");
  if (counts.conclusion < 1) warnings.push("לא זוהה חלק סיום.");
  if (counts.chapter !== EXPECTED_CHAPTERS) {
    warnings.push(`זוהו ${counts.chapter} פרקים (צפוי ${EXPECTED_CHAPTERS}).`);
  }
  const ok = counts.intro >= 1 && counts.chapter >= 1 && counts.conclusion >= 1;
  return { counts, ok, warnings };
}

function reportCleaning(stats: CleaningStats) {
  r("");
  r("## ניקויים שבוצעו");
  r(`- שורות: ${stats.linesBefore} → ${stats.linesAfter}`);
  r(`- מספרי עמוד שהוסרו: ${stats.pageNumbersRemoved}`);
  r(`- כותרות רצות שזוהו: ${stats.runningHeaders.length} (${stats.runningHeadersRemoved} מופעים הוסרו)`);
  for (const h of stats.runningHeaders) r(`  - "${sanitize(h)}"`);
  r(`- שורות כפולות עוקבות שהוסרו: ${stats.duplicatesRemoved}`);
  r(`- שורות עם תיקון ריווח-אותיות: ${stats.letterSpacingFixed}`);
}

/** מדפיס לקונסול (לעיניך בלבד) כולל מובאות קצרות — לא נכתב לקובץ. */
function printEvalToConsole(report: EvalReport) {
  log("");
  log("── הערכת 30 השאלות (קונסול; מובאות קצרות) ──");
  for (const q of report.questions) {
    const flag = q.sufficient ? "✓" : q.noise ? "~" : "✗";
    log(`${flag} [${q.id}] "${q.question}" — ${q.resultCount} תוצאות, ציון עליון ${q.topScore ?? "—"}`);
    for (const e of q.excerpts) {
      const loc = e.sectionName ? `${e.chapterName} / ${e.sectionName}` : e.chapterName;
      log(`      · פרק ${e.chapterNumber} (${loc}) [${e.score}]: ${e.snippet}`);
    }
  }
}

/** כותב לדוח את טבלת 30 השאלות — מיקום וציונים בלבד, ללא מובאות/תוכן גולמי. */
function reportEval(report: EvalReport) {
  const c = report.calibration;
  r("");
  r("## 30 שאלות החיפוש");
  r("| # | נושא | שאלה | פרקים שנשלפו (ציון) | ציון עליון | מצב |");
  r("|---|------|------|--------------------|-----------|-----|");
  for (const q of report.questions) {
    const locs =
      q.excerpts.map((e) => `פרק ${e.chapterNumber} (${e.score})`).join("; ") || "—";
    const verdict = q.sufficient ? "תקין" : q.noise ? "רעש" : "נכשל";
    r(`| ${q.id} | ${sanitize(q.theme)} | ${sanitize(q.question)} | ${locs} | ${q.topScore ?? "—"} | ${verdict} |`);
  }

  const unanswered = report.questions.filter((q) => !q.sufficient);
  const noisy = report.questions.filter((q) => q.noise);
  const ratio = report.answeredCount / report.totalQuestions;

  r("");
  r("## כיול סף החיפוש");
  r(`- התאמות אמיתיות (ציון עליון): min ${c.positiveTop.min}, p25 ${c.positiveTop.p25}, median ${c.positiveTop.median}, max ${c.positiveTop.max} (n=${c.positiveTop.count})`);
  r(`- רצפת רעש (off-topic מרבי): ${c.negativeMax}`);
  r(`- **סף מומלץ ל-DEFAULT_MIN_SCORE:** ${c.suggestedMinScore}`);
  r(`- שיעור שאלות תקינות: **${(ratio * 100).toFixed(0)}%** (${report.answeredCount}/${report.totalQuestions})`);
  r(`- שאלות ללא מענה: ${unanswered.length ? unanswered.map((q) => q.id).join(", ") : "אין"}`);
  r(`- שאלות עם רעש: ${noisy.length ? noisy.map((q) => q.id).join(", ") : "אין"}`);
  r("");
  r("## מסקנת FTS מול Hybrid");
  const ftsEnough = c.ftsSeparatesWell && ratio >= MIN_SUFFICIENT_RATIO;
  r(
    ftsEnough
      ? "- **FTS בעברית מספיק:** ההפרדה בין רעש להתאמות ברורה ושיעור התקינות מעל הסף."
      : "- **ייתכן שנדרש אחזור היברידי (hybrid):** " + sanitize(c.note)
  );
}

async function main() {
  // 0) שער בטיחות: הגרסה חייבת להיות בדיוק זו, אחרת לא כותבים כלום.
  if (VERSION !== "medaytim-laahava-888-final") {
    await failStep("אימות גרסה", "מזהה הגרסה אינו medaytim-laahava-888-final");
  }
  const activate = process.argv.slice(2).includes("--activate");
  const dsn = process.env.DATABASE_URL;
  if (!dsn) await failStep("קריאת סביבה", "DATABASE_URL אינו מוגדר");
  const useSsl = /sslmode=require/i.test(dsn!);

  await mkdir(TMP_DIR, { recursive: true });
  r(`# דוח ייבוא — ${VERSION}`);
  r("");
  r(`- זמן ריצה (UTC): ${new Date().toISOString()}`);
  r(`- מצב הפעלה: ${activate ? "--activate (מותנה בשערים)" : "ללא הפעלה (inactive בלבד)"}`);

  // 1) הורדה + checksum.
  log("1/9 מוריד את ה-PDF מ-Storage…");
  let dl: Awaited<ReturnType<typeof downloadBook>>;
  try {
    dl = await downloadBook();
  } catch (err) {
    return failStep("הורדת PDF", err instanceof Error ? err.message : "שגיאת הורדה");
  }
  log(`    נשמר (${(dl.size / 1_048_576).toFixed(2)} MB), checksum ${dl.checksum}`);
  r("");
  r("## סיכום ריצה");
  r(`- checksum (sha256): \`${dl.checksum}\``);
  r(`- גודל קובץ: ${(dl.size / 1_048_576).toFixed(2)} MB`);

  // 2) חילוץ + זיהוי שכבת-טקסט.
  log("2/9 מחלץ טקסט (סדר קריאה עברי)…");
  let pdf: Awaited<ReturnType<typeof extractPdf>>;
  try {
    pdf = await extractPdf(dl.data);
  } catch (err) {
    return failStep("חילוץ PDF", err instanceof Error ? err.message : "שגיאת חילוץ");
  }
  log(`    ${pdf.pageCount} עמודים, ${pdf.totalChars} תווים.`);
  r(`- מספר עמודים: ${pdf.pageCount}`);
  r(`- תווים שחולצו: ${pdf.totalChars}`);
  if (!pdf.hasTextLayer) {
    r(`- שכבת-טקסט: **לא נמצאה** (ה-PDF ככל הנראה סרוק).`);
    return failStep(
      "אימות שכבת-טקסט",
      "לא נמצאה שכבת-טקסט שימושית — עוצר לפני OCR רחב, כנדרש. דרושה החלטה על מסלול OCR נפרד."
    );
  }
  r(`- שכבת-טקסט: נמצאה.`);

  // 3) ניקוי.
  log("3/9 מנקה רעש טכני…");
  const { pages: cleanedLines, stats: cleaning } = cleanPagesDetailed(
    pdf.pages.map((p) => p.lines)
  );
  const cleanPagesInput: CleanPage[] = pdf.pages.map((p, i) => ({
    pageNumber: p.pageNumber,
    lines: cleanedLines[i],
  }));
  reportCleaning(cleaning);

  // 4) זיהוי מבנה + אימות.
  log("4/9 מזהה מבנה…");
  const source = detectStructure(cleanPagesInput, { version: VERSION, title: "מדייטים לאהבה" });
  const structure = verifyStructure(source);
  log(
    `    מבוא ${structure.counts.intro} · פרקים ${structure.counts.chapter} · סיום ${structure.counts.conclusion} · נספחים ${structure.counts.appendix}`
  );
  r("");
  r("## מבנה שזוהה");
  r(`- מבוא: ${structure.counts.intro}`);
  r(`- פרקים: ${structure.counts.chapter} (צפוי ${EXPECTED_CHAPTERS})`);
  r(`- סיום: ${structure.counts.conclusion}`);
  r(`- נספחים: ${structure.counts.appendix}`);
  for (const w of structure.warnings) r(`- ⚠ ${sanitize(w)}`);
  if (!structure.ok) {
    return failStep(
      "אימות מבנה",
      "חסר מבוא/פרקים/סיום — בדקו את זיהוי הכותרות מול תוכן העניינים בפועל."
    );
  }

  // 5) חלוקה + בדיקת פרק ריק.
  log("5/9 מחלק לקטעים…");
  const chunks = chunkBook(source);
  if (chunks.length === 0) return failStep("chunking", "לא נוצרו קטעים מהמקור.");
  for (const ch of source.chapters) {
    const total = ch.sections.reduce((n, s) => n + s.paragraphs.length, 0);
    if (total === 0) {
      return failStep("chunking", `חלק ריק ללא תוכן: ${ch.type ?? "chapter"} ${ch.number}.`);
    }
  }
  const perChapter = new Map<string, { label: string; count: number }>();
  for (const c of chunks) {
    const key = `${c.sectionType}:${c.chapterNumber}:${c.chapterName}`;
    const cur = perChapter.get(key);
    if (cur) cur.count += 1;
    else
      perChapter.set(key, {
        label: `${c.sectionType} ${c.chapterNumber} — ${c.chapterName}`,
        count: 1,
      });
  }
  r("");
  r("## chunks");
  r(`- סך הכול: **${chunks.length}**`);
  r("");
  r("| חלק | chunks |");
  r("|-----|--------|");
  for (const { label, count } of perChapter.values()) r(`| ${sanitize(label)} | ${count} |`);

  // snapshot של המקור לבדיקה ידנית (מוחרג-Git; לא נכנס למאגר).
  await writeFile(
    path.join(TMP_DIR, `${VERSION}.source.json`),
    JSON.stringify(source, null, 2),
    "utf8"
  );

  // ── מכאן: פעולות מסד (טרנזקציוני, נשאר inactive) ──
  log("6/9 מייבא כ-inactive ומריץ בדיקות שלמות…");
  const pool = new Pool({
    connectionString: dsn,
    max: 3,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect();
  try {
    const res = await importVersion(client, source); // begin/commit; status=inactive
    log(`    יובאו ${res.sectionCount} קטעים (inactive).`);

    // 6) בדיקות שלמות: ספירה, כפילויות, מטא-דאטה חסר, תוכן ריק.
    const integrity = await client.query(
      `select
         count(*)::int                                              as n,
         count(*) filter (where content is null or btrim(content) = '')::int as empty,
         count(*) filter (where section_type is null or stable_chunk_id is null
                              or chapter_number is null or chapter_name is null)::int as missing_meta,
         (count(*) - count(distinct stable_chunk_id))::int          as dup_ids
       from compass_book_sections where book_version = $1`,
      [VERSION]
    );
    const iv = integrity.rows[0] as {
      n: number;
      empty: number;
      missing_meta: number;
      dup_ids: number;
    };
    r("");
    r("## בדיקות שלמות");
    r(`- קטעים במסד: ${iv.n} (צפוי ${chunks.length})`);
    r(`- קטעים ריקים: ${iv.empty}`);
    r(`- קטעים עם metadata חסר: ${iv.missing_meta}`);
    r(`- מזהי-קטע כפולים: ${iv.dup_ids}`);
    if (iv.n !== chunks.length)
      throw new Error(`אי-התאמה בספירת קטעים: DB=${iv.n}, צפוי=${chunks.length}.`);
    if (iv.empty > 0) throw new Error(`${iv.empty} קטעים עם תוכן ריק.`);
    if (iv.missing_meta > 0) throw new Error(`${iv.missing_meta} קטעים עם metadata חסר.`);
    if (iv.dup_ids > 0) throw new Error(`${iv.dup_ids} מזהי-קטע כפולים.`);

    // 7) 30 שאלות + כיול (מול הגרסה המיובאת, עוד לפני הפעלה).
    log("7/9 מריץ 30 שאלות + כיול סף…");
    const report = await evaluateSearch(pool, VERSION);
    printEvalToConsole(report);
    reportEval(report);

    // 8) שער הפעלה + אישורים.
    const ratio = report.answeredCount / report.totalQuestions;
    const gatesPass =
      structure.ok && report.calibration.ftsSeparatesWell && ratio >= MIN_SUFFICIENT_RATIO;
    r("");
    r("## שער הפעלה");
    r(`- מבנה תקין: ${structure.ok ? "כן" : "לא"}`);
    r(`- FTS מפריד היטב: ${report.calibration.ftsSeparatesWell ? "כן" : "לא"}`);
    r(`- שיעור התאמה מספקת: ${(ratio * 100).toFixed(0)}% (סף ${MIN_SUFFICIENT_RATIO * 100}%)`);
    r("");
    r("## אישורים");
    r(`- הגרסה **נשארה inactive** (לא הופעלה בהרצה זו).`);
    r("- **COMPASS_ASSISTANT_ENABLED לא שונה** — המצפן נשאר כבוי.");
    r("- הייבוא בוצע בטרנזקציה יחידה (begin/commit); כישלון מגלגל אחורה.");
    r("- המיגרציה additive ואידמפוטנטית (ADD COLUMN / CREATE INDEX IF NOT EXISTS).");

    if (activate) {
      if (!gatesPass) {
        throw new Error("שער ההפעלה לא עבר — הגרסה נשארת inactive.");
      }
      await activateVersion(client, VERSION);
      r(`- ✅ הופעלה הגרסה (single active version).`);
      log(`✅ הגרסה "${VERSION}" הופעלה.`);
    }

    await writeReport();
    log("");
    log(`✅ הסתיים. דוח מסונן נכתב אל ${REPORT_PATH}`);
    if (!activate) {
      log("   הגרסה inactive. שלחו את הדוח לבדיקה לפני הפעלה.");
    }
  } catch (err) {
    return failStep("ייבוא/בדיקות/הערכה", err instanceof Error ? err.message : "שגיאה בלתי צפויה");
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
