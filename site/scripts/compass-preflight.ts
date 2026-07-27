/**
 * Preflight לייבוא ספר 888 — הרצה מקומית (Claude Code CLI / המחשב שלך).
 *
 *   npx tsx scripts/compass-preflight.ts
 *
 * בודק אך ורק (קריאה בלבד, ללא כתיבה, ללא הדפסת ערכים):
 *   1. נוכחות הסודות: SUPABASE_URL, SUPABASE_SECRET_KEY|SERVICE_ROLE_KEY, DATABASE_URL.
 *   2. חיבור למסד: SELECT 1 (Session Pooler 5432, sslmode=require).
 *   3. גישה ל-Storage API ואימות קיום הקובץ books-private/medaytim-laahava-888-final.pdf.
 *
 * נעצר עם קוד יציאה שאינו 0 על הכשל הראשון — לפני כל פעולת כתיבה. אינו
 * מדפיס מפתחות, סיסמאות, connection strings, tokens או תוכן כלשהו של הספר.
 */
import { Pool } from "pg";

const BUCKET = "books-private";
const OBJECT_PATH = "medaytim-laahava-888-final.pdf";

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg: string): never {
  console.error(`  ✗ ${msg}`);
  console.error("preflight: נעצר לפני כל כתיבה. תקנו את הבעיה והריצו שוב.");
  process.exit(1);
}

async function main() {
  console.log("Preflight — ייבוא ספר 888 (קריאה בלבד):");

  // 1) נוכחות סודות (ללא הדפסת ערכים).
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyName = process.env.SUPABASE_SECRET_KEY
    ? "SUPABASE_SECRET_KEY"
    : process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "SUPABASE_SERVICE_ROLE_KEY"
      : null;
  const dsn = process.env.DATABASE_URL;

  if (!url) fail("SUPABASE_URL חסר");
  if (!key || !keyName) fail("SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY חסר");
  if (!dsn) fail("DATABASE_URL חסר");
  ok(`סודות נוכחים (מפתח פעיל: ${keyName}; ערכים לא מודפסים)`);

  // 2) SELECT 1 מול המסד.
  const useSsl = /sslmode=require/i.test(dsn);
  const pool = new Pool({
    connectionString: dsn,
    max: 1,
    // Supabase pooler דורש TLS; sslmode=require ב-DSN מסומן כאן ל-node-postgres.
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
  try {
    const r = await pool.query("select 1 as ok");
    if (r.rows?.[0]?.ok !== 1) fail("SELECT 1 החזיר תוצאה בלתי צפויה");
    ok(`חיבור למסד תקין (SELECT 1)${useSsl ? " עם sslmode=require" : ""}`);
  } catch {
    // לא מדפיסים DSN/מארח/סיסמה — רק שהחיבור נכשל.
    await pool.end().catch(() => {});
    fail("החיבור למסד נכשל (בדקו DATABASE_URL — Session Pooler 5432, sslmode=require, וגישת רשת)");
  }
  await pool.end().catch(() => {});

  // 3) גישה ל-Storage API + אימות קיום הקובץ (endpoint info — ללא הורדת תוכן).
  const infoUrl = `${url.replace(/\/$/, "")}/storage/v1/object/info/${BUCKET}/${OBJECT_PATH}`;
  let res: Response;
  try {
    res = await fetch(infoUrl, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
  } catch {
    fail("גישה ל-Storage API נכשלה (בדקו SUPABASE_URL וגישת רשת ל-*.supabase.co)");
  }
  if (res.status === 401 || res.status === 403) {
    fail(`Storage דחה את הבקשה (status ${res.status}) — בדקו את מפתח השרת`);
  }
  if (res.status === 404) {
    fail(`הקובץ לא נמצא: ${BUCKET}/${OBJECT_PATH} (status 404)`);
  }
  if (!res.ok) {
    fail(`גישה ל-Storage נכשלה (status ${res.status})`);
  }
  // מדפיסים רק מטא-דאטה לא-רגישה (גודל), לעולם לא תוכן.
  let size = "unknown";
  try {
    const meta = (await res.json()) as { size?: number; metadata?: { size?: number } };
    const bytes = meta.size ?? meta.metadata?.size;
    if (typeof bytes === "number") size = `${(bytes / 1_048_576).toFixed(2)} MB`;
  } catch {
    /* מטא-דאטה לא זמינה — לא קריטי */
  }
  ok(`Storage נגיש והקובץ קיים: ${BUCKET}/${OBJECT_PATH} (גודל ${size})`);

  console.log("Preflight עבר. בטוח להמשיך לשלב ההורדה והייבוא.");
}

void main();
