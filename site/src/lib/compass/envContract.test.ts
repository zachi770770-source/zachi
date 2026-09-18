import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * חוזה-הסביבה של „שאל את הספר”.
 *
 * ── מאיפה הבדיקה הזו נולדה ────────────────────────────────────────────────
 * ‎.env.example‎ מנה ‎COMPASS_PG_URL‎ בלי הערה, ממש לצד משתני-המצפן האחרים.
 * המשתנה הזה הוא **בדיקות בלבד** — הוא מפעיל את בדיקות-האינטגרציה מול
 * PostgreSQL, שמדלגות על עצמן בלעדיו. הריצה בפועל (‎getCompassDb()‎) קוראת
 * ‎DATABASE_URL‎ ותו לא, וכך היה מאז הקומיט הראשון שהציג את שניהם (‎dbab1b3‎).
 *
 * הסיכון אינו תיאורטי: מי שקורא את התבנית ומגדיר את ה-DSN של פרודקשן תחת
 * ‎COMPASS_PG_URL‎ מקבל בדיוק את מצב-הכשל הכי מבלבל שיש — ‎getCompassDb()‎
 * מחזיר ‎null‎, ‎/api/compass‎ עונה „לא זמין”, וזה **נראה זהה** למצב שבו הדגל
 * כבוי; בזמן שמסד נתונים מלא ותקין יושב בצד ואינו בשימוש.
 *
 * הבדיקות כאן מקבעות את החוזה כדי שהבלבול הזה לא יחזור בשקט.
 */

const SITE_ROOT = join(__dirname, "..", "..", "..");
const read = (rel: string) => readFileSync(join(SITE_ROOT, rel), "utf8");

const ENV_EXAMPLE = read(".env.example");
const DB_SOURCE = read("src/lib/compass/assistant/db.ts");
const CONFIG_SOURCE = read("src/lib/compass/assistant/config.ts");
const SCRIPT_SOURCE = read("scripts/compass.ts");

describe("חוזה-הסביבה של המצפן — מקור-החיבור", () => {
  it("הריצה קוראת DATABASE_URL", () => {
    expect(DB_SOURCE).toContain("process.env.DATABASE_URL");
  });

  /**
   * לא „פיצ׳ר חסר” אלא החלטה: fallback ל-COMPASS_PG_URL היה מאפשר למשתנה
   * שנועד לבדיקות להפנות את הריצה אל מסד-בדיקות. אם אי-פעם *ירצו* fallback,
   * זו תהיה החלטה מפורשת — והבדיקה הזו היא שתאלץ לקבל אותה במודע.
   */
  it("הריצה אינה קוראת COMPASS_PG_URL — גם לא כ-fallback", () => {
    expect(DB_SOURCE).not.toContain("COMPASS_PG_URL");
  });

  it("‏COMPASS_PG_URL משמש אך ורק בבדיקות-אינטגרציה", () => {
    const usedIn = [
      "src/lib/compass/compass.integration.test.ts",
      "src/lib/compass/assistant/quota.integration.test.ts",
    ];
    for (const f of usedIn) expect(read(f)).toContain("COMPASS_PG_URL");
  });
});

describe("חוזה-הסביבה של המצפן — התבנית אינה רשאית להטעות", () => {
  /**
   * הכלל: כל משתנה ב-‎.env.example‎ שנראה כמו מקור-חיבור למסד חייב *או* להיקרא
   * בזמן ריצה, *או* לשאת הערה שמסמנת אותו כבדיקות-בלבד. תבנית שמציעה משתנה
   * שאיש אינו קורא היא מלכודת-תצורה, לא תיעוד.
   */
  const dbLikeVars = ENV_EXAMPLE.split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => l.split("=")[0])
    .filter((name) => /(_URL|_DSN|DATABASE|_PG)/.test(name));

  it("נמצאו משתני-חיבור לבדיקה", () => {
    expect(dbLikeVars).toContain("DATABASE_URL");
    expect(dbLikeVars).toContain("COMPASS_PG_URL");
  });

  it.each(dbLikeVars)("‏%s נקרא בריצה או מסומן במפורש כבדיקות-בלבד", (name) => {
    const readAtRuntime = /(DATABASE_URL|NEXT_PUBLIC_SITE_URL)/.test(name);
    if (readAtRuntime) return;

    // ההערות שמעל השורה, עד השורה הריקה/הכותרת הקודמת.
    const lines = ENV_EXAMPLE.split("\n");
    const idx = lines.findIndex((l) => l.trim().startsWith(`${name}=`));
    const preamble: string[] = [];
    for (let i = idx - 1; i >= 0 && lines[i].trim().startsWith("#"); i -= 1) {
      preamble.unshift(lines[i]);
    }
    const note = preamble.join("\n");
    expect(
      /TEST-ONLY|test only|בדיקות בלבד/i.test(note),
      `${name} אינו נקרא בזמן ריצה ואינו מסומן כבדיקות-בלבד ב-.env.example`,
    ).toBe(true);
  });
});

describe("חוזה-הסביבה של המצפן — גרסת-הספר הנדרשת", () => {
  /**
   * ‎scripts/compass.ts‎ משכפל את ברירת-המחדל בכוונה: ‎config.ts‎ מסומן
   * ‎server-only‎ ואינו ניתן לייבוא לסקריפט ‎tsx‎. ההערה שם מבקשת „שמרו את שני
   * המקומות מסונכרנים” — וזו הבדיקה שהופכת את הבקשה לאכיפה. אחרת ‎doctor‎ היה
   * יכול לדווח „תקין” על גרסה שהריצה כלל אינה מקבלת.
   */
  const pick = (src: string, ident: string) =>
    src.match(new RegExp(`${ident}\\s*=\\s*"([^"]+)"`))?.[1];

  it("הריצה והסקריפט מצפים לאותה גרסה בדיוק", () => {
    const runtime = pick(CONFIG_SOURCE, "DEFAULT_REQUIRED_BOOK_VERSION");
    const script = pick(SCRIPT_SOURCE, "REQUIRED_BOOK_VERSION_DEFAULT");
    expect(runtime).toBeTruthy();
    expect(script).toBe(runtime);
  });

  it("הגרסה הנדרשת היא גרסת-888 המאושרת", () => {
    expect(pick(CONFIG_SOURCE, "DEFAULT_REQUIRED_BOOK_VERSION")).toBe(
      "medaytim-laahava-888-final",
    );
  });

  /** „קיימת גרסה פעילה כלשהי” אינו מספיק — היא חייבת להיות *הגרסה הזו*. */
  it("הזמינות דורשת התאמה מדויקת, לא „גרסה פעילה כלשהי”", () => {
    const route = read("src/app/(he)/api/compass/route.ts");
    expect(route).toMatch(/getActiveVersion\(db\)\)\s*===\s*requiredBookVersion\(\)/);
  });
});
