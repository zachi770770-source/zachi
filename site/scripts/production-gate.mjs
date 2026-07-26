/**
 * Production Gate — server-only, runs during the Vercel build (before `next build`).
 *
 * Verifies, using ONLY server environment variables, that:
 *   1. The waitlist Postgres DB is reachable and writable (real INSERT→SELECT
 *      round-trip inside a transaction that is ROLLED BACK — no residue).
 *   2. The private book object can receive a short-lived signed URL.
 *
 * Safety:
 *   - Never prints emails, DATABASE_URL, host, user, password, keys, the signed
 *     URL, bucket, object path or stack traces. On failure it prints ONLY a safe
 *     stage + code + classification, and exits non-zero to FAIL the build.
 *   - Local builds (no env vars, not on Vercel) skip explicitly and succeed.
 *   - On Vercel (VERCEL=1) the relevant checks are MANDATORY: missing env or any
 *     failure fails the build.
 *   - Storage: uses createSignedUrl only — never getPublicUrl, never alters the
 *     bucket. Does not read or change SALES_ENABLED.
 */

import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const HARD_TIMEOUT_MS = 45_000;
const timer = setTimeout(() => {
  console.error("[production-gate] FAILED stage=timeout code=none classification=gate_timeout");
  process.exit(1);
}, HARD_TIMEOUT_MS);
timer.unref?.();

/** מיפוי קודים ידועים → סיווג בטוח. לעולם לא נוגע ב-message/stack/פרטי חיבור. */
function meta(err) {
  const raw =
    err && (err.code ?? err.cause?.code ?? err.status ?? err.statusCode);
  const code = raw != null && String(raw).length ? String(raw) : "none";
  const MAP = {
    "28P01": "authentication_failed",
    "28000": "invalid_authorization",
    "3D000": "database_missing",
    "42P01": "relation_missing",
    "42501": "permission_denied",
    ENOTFOUND: "host_not_found",
    ECONNREFUSED: "connection_refused",
    ETIMEDOUT: "connection_timeout",
    SELF_SIGNED_CERT_IN_CHAIN: "ssl_error",
    DEPTH_ZERO_SELF_SIGNED_CERT: "ssl_error",
    UNABLE_TO_VERIFY_LEAF_SIGNATURE: "ssl_error",
    CERT_HAS_EXPIRED: "ssl_error",
    "400": "object_not_found",
    "404": "object_not_found",
    "401": "not_authorized",
    "403": "not_authorized",
    "429": "rate_limited",
    "500": "storage_unavailable",
    "503": "storage_unavailable",
  };
  const classification = MAP[code] || (code.includes("CERT") ? "ssl_error" : "unknown");
  return { code, classification };
}

function fail(stage, err) {
  const { code, classification } = meta(err);
  console.error(
    `[production-gate] FAILED stage=${stage} code=${code} classification=${classification}`
  );
  process.exit(1);
}

/** DDL אידמפוטני — זהה ל-migration הקנוני של רשימת ההמתנה. */
const CREATE_TABLE_SQL = `create table if not exists waitlist_subscribers (
  id                bigint generated always as identity primary key,
  email_normalized  text        not null unique,
  email_original    text        not null,
  source            text        not null,
  consent_version   text        not null,
  consent_at        timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  status            text        not null default 'active'
                       check (status in ('active','unsubscribed')),
  notified_at       timestamptz
)`;

async function verifyWaitlistDb() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 15_000,
  });

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    await pool.end().catch(() => {});
    fail("db_connect", err);
  }

  try {
    // מוודאים שהסכימה קיימת (מחויב, מחוץ ל-transaction) כדי שגם production יעבוד.
    try {
      await client.query(CREATE_TABLE_SQL);
    } catch (err) {
      fail("db_schema", err);
    }

    // ודא שהטבלה קיימת בפועל.
    const exists = await client.query(
      "select to_regclass('public.waitlist_subscribers') as t"
    );
    if (!exists.rows[0] || exists.rows[0].t === null) {
      fail("db_table_missing", { code: "42P01" });
    }

    // round-trip בתוך transaction, מתגלגל לאחור — שורת הבדיקה לעולם לא נשמרת.
    const rnd = Math.random().toString(36).slice(2, 12);
    const testEmail = `gate-${rnd}@example.invalid`; // לעולם לא מודפס
    await client.query("begin");
    try {
      await client.query(
        `insert into waitlist_subscribers
           (email_normalized, email_original, source, consent_version, consent_at, status)
         values ($1, $1, 'production-gate', 'gate', now(), 'active')`,
        [testEmail]
      );
      const sel = await client.query(
        "select 1 from waitlist_subscribers where email_normalized = $1",
        [testEmail]
      );
      if (sel.rows.length !== 1) {
        await client.query("rollback");
        fail("db_roundtrip", { code: "none" });
      }
    } finally {
      await client.query("rollback").catch(() => {});
    }
  } catch (err) {
    fail("db_roundtrip", err);
  } finally {
    client?.release();
    await pool.end().catch(() => {});
  }
}

async function verifyBookStorage() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );
    const { data, error } = await supabase.storage
      .from(process.env.BOOK_STORAGE_BUCKET)
      .createSignedUrl(process.env.BOOK_PDF_PATH, 60, {
        download: "medaytim-laahava.pdf",
      });
    if (error) fail("storage_sign", error);
    if (!data || !data.signedUrl) fail("storage_no_url", { code: "no_signed_url" });
    // הצלחה — הקישור החתום לעולם לא מודפס.
  } catch (err) {
    fail("storage_sign", err);
  }
}

async function main() {
  const onVercel = process.env.VERCEL === "1";
  const hasDb = !!process.env.DATABASE_URL;
  const hasStorage = !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SECRET_KEY &&
    process.env.BOOK_STORAGE_BUCKET &&
    process.env.BOOK_PDF_PATH
  );

  // מקומית ללא משתנים — דילוג מפורש כדי שה-build לא ייכשל.
  if (!onVercel && !hasDb && !hasStorage) {
    console.log("[production-gate] SKIP — local build, no server env vars present.");
    clearTimeout(timer);
    return;
  }

  // ב-Vercel הבדיקות חובה: משתנה חסר = כשל build.
  if (onVercel && !hasDb) fail("config_db_env", { code: "DATABASE_URL_missing" });
  if (onVercel && !hasStorage) fail("config_storage_env", { code: "storage_env_missing" });

  let waitlistDbVerified = false;
  let bookStorageVerified = false;

  if (hasDb) {
    await verifyWaitlistDb();
    waitlistDbVerified = true;
  } else {
    console.log("[production-gate] waitlist DB check skipped — DATABASE_URL absent (local).");
  }

  if (hasStorage) {
    await verifyBookStorage();
    bookStorageVerified = true;
  } else {
    console.log("[production-gate] book storage check skipped — storage env absent (local).");
  }

  console.log(`[production-gate] waitlistDbVerified=${waitlistDbVerified}`);
  console.log(`[production-gate] bookStorageVerified=${bookStorageVerified}`);
  console.log("[production-gate] PASS");
  clearTimeout(timer);
}

main().catch((err) => fail("unexpected", err));
