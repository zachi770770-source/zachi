/**
 * סקריפט ניהול מאובטח לשכבת הידע של „המצפן”.
 *
 * הרצה (שרת בלבד; דורש DATABASE_URL של Postgres):
 *   npx tsx scripts/compass.ts <command> [args]
 *
 * פקודות:
 *   import   <source.json>   ייבוא/עדכון גרסה (כ-inactive)
 *   activate <version>       הפעלת גרסה (מכבה אחרות אטומית)
 *   deactivate <version>     ביטול הפעלה
 *   rollback <version>       הפעלה מחדש של גרסה קודמת
 *   reindex                  בנייה מחדש של אינדקס החיפוש
 *   list                     רשימת גרסאות (ללא תוכן)
 *   doctor                   אבחון תפעולי: אילו תנאים ל„שאל את הספר” מתקיימים
 *                            (דגלים/מסד/גרסה/מפתח) — בוליאני בלבד, בלי ערכים
 *
 * הסקריפט אינו מדפיס את תוכן הספר ואינו מדפיס את ה-DATABASE_URL. פעולות
 * הייבוא/הפעלה רצות על חיבור ייעודי יחיד (טרנזקציה), כך שכישלון מגלגל
 * אחורה ואינו משאיר גרסה חלקית.
 */
import { readFile } from "node:fs/promises";

import { Pool } from "pg";

import type { BookSource } from "@/lib/compass/types";
import {
  importVersion,
  activateVersion,
  deactivateVersion,
  rollbackToVersion,
  rebuildSearchIndex,
  listVersions,
} from "@/lib/compass/importer";

function fail(message: string): never {
  console.error(`compass: ${message}`);
  process.exit(1);
}

/**
 * ברירת המחדל של גרסת-הספר הנדרשת. משוכפל בכוונה מ-config.ts
 * (DEFAULT_REQUIRED_BOOK_VERSION), כי config.ts מסומן "server-only" ואינו ניתן
 * לייבוא לתוך סקריפט tsx. שמרו את שני המקומות מסונכרנים.
 */
const REQUIRED_BOOK_VERSION_DEFAULT = "medaytim-laahava-888-final";

/**
 * אבחון תפעולי ל„שאל את הספר”: מדפיס אילו תנאים מתקיימים — בוליאני בלבד,
 * לעולם לא ערכי סוד (אין DSN, אין מפתח, אין תוכן ספר). מריץ גם כשאין
 * DATABASE_URL, כדי לאבחן בדיוק מה חסר בסביבה נתונה.
 */
async function doctorCommand(): Promise<void> {
  const requiredVersion =
    process.env.COMPASS_REQUIRED_BOOK_VERSION || REQUIRED_BOOK_VERSION_DEFAULT;
  const flagEnabled = process.env.COMPASS_ASSISTANT_ENABLED === "true";
  const hasKey =
    typeof process.env.ANTHROPIC_API_KEY === "string" &&
    process.env.ANTHROPIC_API_KEY.length > 0;
  const dsn = process.env.DATABASE_URL;

  let dbReachable = false;
  let activeVersion: string | null = null;
  let activeSections = 0;
  if (dsn) {
    const pool = new Pool({ connectionString: dsn, max: 1 });
    try {
      const v = await pool.query(
        `select version from compass_book_versions where status = 'active' limit 1`
      );
      dbReachable = true;
      activeVersion = (v.rows[0] as { version?: string } | undefined)?.version ?? null;
      if (activeVersion) {
        const c = await pool.query(
          `select count(*)::int as n from compass_book_sections where is_active`
        );
        activeSections = (c.rows[0] as { n: number }).n;
      }
    } catch {
      dbReachable = false;
    } finally {
      await pool.end();
    }
  }

  const versionMatches = activeVersion === requiredVersion;
  const mark = (ok: boolean) => (ok ? "OK  " : "MISSING");
  const line = (ok: boolean, label: string) => console.log(`  [${mark(ok)}] ${label}`);

  console.log("ask-the-book (compass) readiness:");
  line(flagEnabled, "COMPASS_ASSISTANT_ENABLED=true (feature flag)");
  line(!!dsn, "DATABASE_URL is set");
  line(dbReachable, "database reachable");
  line(
    versionMatches,
    `active book version matches required "${requiredVersion}"` +
      (activeVersion ? ` (active: "${activeVersion}", ${activeSections} sections)` : " (no active version)")
  );
  line(hasKey, "ANTHROPIC_API_KEY is set (model provider)");

  const ready = flagEnabled && !!dsn && dbReachable && versionMatches && hasKey;
  console.log(ready ? "\nREADY: ask-the-book will serve live answers." : "\nNOT READY: fix the MISSING items above.");
  if (!ready) process.exitCode = 2;
}

async function main() {
  const [command, arg] = process.argv.slice(2);

  // doctor רץ לפני בדיקת ה-DSN — כדי שיוכל לדווח שהוא בעצמו חסר.
  if (command === "doctor") {
    await doctorCommand();
    return;
  }

  const dsn = process.env.DATABASE_URL;
  if (!dsn) fail("DATABASE_URL is not set");
  if (!command) fail("usage: compass <import|activate|deactivate|rollback|reindex|list|doctor> [args]");

  const pool = new Pool({ connectionString: dsn, max: 2 });
  const client = await pool.connect();
  try {
    switch (command) {
      case "import": {
        if (!arg) fail("import requires a path to a source JSON file");
        const raw = await readFile(arg, "utf8");
        const source = JSON.parse(raw) as BookSource;
        const res = await importVersion(client, source);
        console.log(`imported version "${res.version}" (${res.sectionCount} sections, inactive)`);
        break;
      }
      case "activate": {
        if (!arg) fail("activate requires a version id");
        await activateVersion(client, arg);
        console.log(`activated version "${arg}"`);
        break;
      }
      case "deactivate": {
        if (!arg) fail("deactivate requires a version id");
        await deactivateVersion(client, arg);
        console.log(`deactivated version "${arg}"`);
        break;
      }
      case "rollback": {
        if (!arg) fail("rollback requires the previous version id to re-activate");
        await rollbackToVersion(client, arg);
        console.log(`rolled back to version "${arg}"`);
        break;
      }
      case "reindex": {
        await rebuildSearchIndex(client);
        console.log("search index rebuilt");
        break;
      }
      case "list": {
        const versions = await listVersions(client);
        for (const v of versions) {
          console.log(`${v.status.padEnd(9)} ${v.version} (${v.sectionCount} sections)`);
        }
        break;
      }
      default:
        fail(`unknown command "${command}"`);
    }
  } catch (err) {
    // אין להדפיס תוכן/DSN — רק סוג התקלה.
    fail(err instanceof Error ? err.message : "unexpected error");
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
