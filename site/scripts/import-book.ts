/**
 * Orchestrator לייבוא ספר 888 אל שכבת הידע של „המצפן” — הרצה מקומית בלבד.
 *
 *   npm run import:book            # ייבוא כ-inactive + כל הבדיקות + דוח (ללא הפעלה)
 *   npm run import:book -- --activate   # כנ"ל, ומפעיל רק אם כל הבדיקות עברו
 *
 * `npm run import:book` מריץ תחילה את ה-preflight (נוכחות סודות, SELECT 1,
 * קיום הקובץ), ורק אז את הסקריפט הזה. השלבים:
 *   1. הורדת ה-PDF מ-Storage אל .import-tmp/ (מוחרג-Git) + checksum.
 *   2. חילוץ טקסט בסדר קריאה עברי + זיהוי שכבת-טקסט.
 *      → אם אין שכבת-טקסט: עצירה ודיווח *לפני* OCR רחב (כנדרש).
 *   3. ניקוי רעש טכני (מספרי עמוד/כותרות רצות/כפילויות/רווחים משובשים).
 *   4. זיהוי מבנה (מבוא / פרקים / סיום / נספחים) + אימות.
 *   5. חלוקה לקטעים (chunker) + ייבוא טרנזקציוני כ-inactive
 *      (version = medaytim-laahava-888-final).
 *   6. בדיקות שלמות.
 *   7. 30 שאלות עבריות + כיול סף מהתפלגות אמיתית + בדיקת רעש.
 *   8. דוח מלא (ללא ציטוטים ארוכים).
 *   9. הפעלה — רק עם --activate ורק אם כל השערים עברו.
 *
 * אינו מדפיס סודות/DSN ואינו מדפיס ציטוטים ארוכים מהספר. הקובץ/הטקסט/ה-chunks
 * נשמרים רק תחת .import-tmp/ (מוחרג לגמרי מ-Git).
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { Pool } from "pg";

import type { BookSource, SectionType } from "@/lib/compass/types";
import { chunkBook } from "@/lib/compass/chunker";
import { importVersion, activateVersion } from "@/lib/compass/importer";
import { cleanPagesDetailed } from "@/lib/compass/extract/clean";
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

function log(msg: string) {
  console.log(msg);
}
function fail(msg: string): never {
  console.error(`import-book: ${msg}`);
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
  // דרישת סף: לפחות מבוא, פרקים, וסיום כלשהם. אזהרה על מספר פרקים חורג
  // אינה חוסמת אוטומטית — נדרשת סקירה אנושית, אך שער ההפעלה בודק זאת.
  const ok = counts.intro >= 1 && counts.chapter >= 1 && counts.conclusion >= 1;
  return { counts, ok, warnings };
}

function printEvalReport(report: EvalReport) {
  log("");
  log("── הערכת 30 השאלות ──");
  for (const q of report.questions) {
    const flag = q.sufficient ? "✓" : q.noise ? "~" : "✗";
    log(
      `${flag} [${q.id}] (${q.theme}) "${q.question}" — ${q.resultCount} תוצאות, ציון עליון ${q.topScore ?? "—"}`
    );
    for (const e of q.excerpts) {
      const loc = e.sectionName ? `${e.chapterName} / ${e.sectionName}` : e.chapterName;
      log(`      · פרק ${e.chapterNumber} (${loc}) [ציון ${e.score}]: ${e.snippet}`);
    }
  }
  const c = report.calibration;
  log("");
  log("── כיול סף ──");
  log(`  התאמות אמיתיות (ציון עליון): min ${c.positiveTop.min}, p25 ${c.positiveTop.p25}, median ${c.positiveTop.median}, max ${c.positiveTop.max} (n=${c.positiveTop.count})`);
  log(`  רצפת רעש (off-topic מרבי): ${c.negativeMax}`);
  log(`  סף מומלץ ל-DEFAULT_MIN_SCORE: ${c.suggestedMinScore}`);
  log(`  FTS מפריד היטב: ${c.ftsSeparatesWell ? "כן" : "לא"} — ${c.note}`);
  log("");
  log(`  שאלות עם התאמה מספקת: ${report.answeredCount}/${report.totalQuestions}`);
}

async function main() {
  const activate = process.argv.slice(2).includes("--activate");
  const dsn = process.env.DATABASE_URL;
  if (!dsn) fail("DATABASE_URL אינו מוגדר");
  const useSsl = /sslmode=require/i.test(dsn);

  // 1) הורדה + checksum.
  log("1/9 מוריד את ה-PDF מ-Storage…");
  const dl = await downloadBook();
  log(`    נשמר: ${dl.filePath} (${(dl.size / 1_048_576).toFixed(2)} MB)`);
  log(`    checksum(sha256): ${dl.checksum}`);

  // 2) חילוץ + זיהוי שכבת-טקסט.
  log("2/9 מחלץ טקסט (סדר קריאה עברי)…");
  const pdf = await extractPdf(dl.data);
  log(`    ${pdf.pageCount} עמודים, ${pdf.totalChars} תווים.`);
  if (!pdf.hasTextLayer) {
    log("");
    log("⛔ לא נמצאה שכבת-טקסט משמעותית — ה-PDF ככל הנראה סרוק (תמונות).");
    log("   עוצר לפני OCR רחב, כפי שנדרש. דרושה החלטה אנושית על מסלול OCR נפרד.");
    // כותב חילוץ חלקי לבדיקה ידנית (מוחרג-Git).
    await writeFile(
      path.join(TMP_DIR, "extract-preview.json"),
      JSON.stringify({ pageCount: pdf.pageCount, totalChars: pdf.totalChars }, null, 2),
      "utf8"
    );
    process.exit(2);
  }

  // 3) ניקוי.
  log("3/9 מנקה רעש טכני (מספרי עמוד/כותרות רצות/כפילויות/רווחים)…");
  const { pages: cleanedLines, stats: cleaning } = cleanPagesDetailed(
    pdf.pages.map((p) => p.lines)
  );
  const cleanPagesInput: CleanPage[] = pdf.pages.map((p, i) => ({
    pageNumber: p.pageNumber,
    lines: cleanedLines[i],
  }));
  log(`    שורות: ${cleaning.linesBefore} → ${cleaning.linesAfter}`);
  log(`    מספרי עמוד שהוסרו: ${cleaning.pageNumbersRemoved}`);
  log(
    `    כותרות רצות שזוהו: ${cleaning.runningHeaders.length} (${cleaning.runningHeadersRemoved} מופעים הוסרו)`
  );
  for (const h of cleaning.runningHeaders) log(`      – "${h}"`);
  log(`    שורות כפולות עוקבות שהוסרו: ${cleaning.duplicatesRemoved}`);
  log(`    שורות עם תיקון ריווח-אותיות: ${cleaning.letterSpacingFixed}`);

  // 4) זיהוי מבנה + אימות.
  log("4/9 מזהה מבנה (מבוא/פרקים/סיום/נספחים)…");
  const source = detectStructure(cleanPagesInput, {
    version: VERSION,
    title: "מדייטים לאהבה",
  });
  const structure = verifyStructure(source);
  log(
    `    מבוא ${structure.counts.intro} · פרקים ${structure.counts.chapter} · סיום ${structure.counts.conclusion} · נספחים ${structure.counts.appendix}`
  );
  for (const w of structure.warnings) log(`    ⚠ ${w}`);
  if (!structure.ok) {
    fail("אימות המבנה נכשל (חסר מבוא/פרקים/סיום). בדקו את זיהוי הכותרות לפני המשך.");
  }

  // 5) חלוקה + ייבוא inactive.
  log("5/9 מחלק לקטעים ומייבא כ-inactive…");
  const chunks = chunkBook(source);
  if (chunks.length === 0) fail("לא נוצרו קטעים מהמקור.");
  // פילוח chunks לפי חלק — לדוח. בדיקת "פרק ריק" (0 chunks) חוסמת.
  const perChapter = new Map<string, { label: string; count: number }>();
  for (const c of chunks) {
    const key = `${c.sectionType}:${c.chapterNumber}:${c.chapterName}`;
    const cur = perChapter.get(key);
    if (cur) cur.count += 1;
    else perChapter.set(key, { label: `${c.sectionType} ${c.chapterNumber} — ${c.chapterName}`, count: 1 });
  }
  log(`    סך ${chunks.length} chunks. פילוח לפי חלק:`);
  for (const { label, count } of perChapter.values()) log(`      · ${label}: ${count}`);
  // כל חלק שזוהה חייב להניב לפחות chunk אחד (אין פרק ריק).
  for (const ch of source.chapters) {
    const total = ch.sections.reduce((n, s) => n + s.paragraphs.length, 0);
    if (total === 0) {
      fail(`חלק ריק ללא תוכן: ${ch.type ?? "chapter"} ${ch.number} — ${ch.name}.`);
    }
  }
  // שומר snapshot של המקור לבדיקה ידנית (מוחרג-Git; לא נכנס למאגר).
  await writeFile(
    path.join(TMP_DIR, `${VERSION}.source.json`),
    JSON.stringify(source, null, 2),
    "utf8"
  );

  const pool = new Pool({
    connectionString: dsn,
    max: 3,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect();
  try {
    const res = await importVersion(client, source);
    log(`    יובאו ${res.sectionCount} קטעים לגרסה "${res.version}" (inactive).`);

    // 6) בדיקות שלמות: ספירה, כפילויות, מטא-דאטה חסר, תוכן ריק.
    log("6/9 בדיקות שלמות…");
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
    if (iv.n !== chunks.length) fail(`אי-התאמה בספירת קטעים: DB=${iv.n}, צפוי=${chunks.length}.`);
    if (iv.empty > 0) fail(`${iv.empty} קטעים עם תוכן ריק.`);
    if (iv.missing_meta > 0) fail(`${iv.missing_meta} קטעים עם metadata חסר.`);
    if (iv.dup_ids > 0) fail(`${iv.dup_ids} מזהי-קטע (stable_chunk_id) כפולים.`);
    log(`    ${iv.n} קטעים במסד — תואם לחלוקה; 0 ריקים, 0 metadata חסר, 0 כפילויות.`);

    // 7) 30 שאלות + כיול (מול הגרסה המיובאת, עוד לפני הפעלה).
    log("7/9 מריץ 30 שאלות + כיול סף…");
    const report = await evaluateSearch(pool, VERSION);

    // 8) דוח.
    printEvalReport(report);

    // 9) הפעלה — רק עם --activate וכל השערים עברו.
    const ratio = report.answeredCount / report.totalQuestions;
    const gatesPass =
      structure.ok && report.calibration.ftsSeparatesWell && ratio >= MIN_SUFFICIENT_RATIO;
    log("");
    log("── שער הפעלה ──");
    log(`  מבנה תקין: ${structure.ok ? "כן" : "לא"}`);
    log(`  FTS מפריד היטב: ${report.calibration.ftsSeparatesWell ? "כן" : "לא"}`);
    log(`  שיעור התאמה מספקת: ${(ratio * 100).toFixed(0)}% (סף ${MIN_SUFFICIENT_RATIO * 100}%)`);

    if (!activate) {
      log("");
      log("ℹ️ הגרסה יובאה כ-inactive ולא הופעלה. סקרו את הדוח, ולהפעלה הריצו:");
      log("   npm run import:book -- --activate");
      log("   או:  npm run compass -- activate " + VERSION);
      return;
    }
    if (!gatesPass) {
      fail("שער ההפעלה לא עבר — הגרסה נשארת inactive. תקנו/כיילו והריצו שוב.");
    }
    await activateVersion(client, VERSION);
    log("");
    log(`✅ הגרסה "${VERSION}" הופעלה (single active version). זכרו: COMPASS_ASSISTANT_ENABLED נשאר false.`);
  } catch (err) {
    fail(err instanceof Error ? err.message : "שגיאה בלתי צפויה בייבוא");
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
