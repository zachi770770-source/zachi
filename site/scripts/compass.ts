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

async function main() {
  const [command, arg] = process.argv.slice(2);
  const dsn = process.env.DATABASE_URL;
  if (!dsn) fail("DATABASE_URL is not set");
  if (!command) fail("usage: compass <import|activate|deactivate|rollback|reindex|list> [args]");

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
