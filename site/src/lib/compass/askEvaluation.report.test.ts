import { describe, it, beforeAll, afterAll, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

vi.mock("server-only", () => ({}));

import { searchCompass, splitQueryTerms, gateDerivedTerms } from "@/lib/compass/search";
import { requiredBookVersion } from "@/lib/compass/assistant/config";

/**
 * דוח-אחזור ל„שאל את הספר” על מערך שאלות בשפה שמשתמשים באמת כותבים בה.
 *
 * זהו **כלי מדידה, לא שער**: הוא אינו מכשיל את הבנייה ואינו קובע ספים. הוא
 * מייצר את הטבלה שצריך כדי לסווג ידנית כל שאלה ל-DIRECT / PRINCIPLE /
 * DECLINE / FALSE-NEGATIVE, ולהשוות לפני-ואחרי שינוי אחזור.
 *
 * למה אין כאן assertions על איכות: סיווג נכון מחייב **קריאה בכתב-היד** —
 * לדעת אם קיים בספר חומר שהיה יכול לבסס תשובה. תיוג מנוחש היה גרוע מכלום,
 * ובדיקה שמאשרת תיוג מנוחש גרועה עוד יותר. `retrievalBenchmark.json` הוא
 * המערך המתויג שכן קובע סף-רגרסיה; זה כאן משלים אותו בשאלות-שטח לא מתויגות.
 *
 * הרצה:
 *   COMPASS_PG_URL=… npx vitest run src/lib/compass/askEvaluation.report.test.ts
 * מדלג בשקט בלי קורפוס פעיל, ולכן אינו משפיע על CI.
 */

type EvalQuestion = {
  id: string;
  intent: string;
  q: string;
  reported?: boolean;
  outOfScope?: boolean;
  note?: string;
};

const EVAL = JSON.parse(
  readFileSync(resolve(process.cwd(), "src/lib/compass/__fixtures__/askEvaluation.json"), "utf8"),
) as { questions: EvalQuestion[] };

const PG = process.env.COMPASS_PG_URL;
/** ניתן להצביע על קורפוס אחר (למשל קורפוס-האבחון) דרך COMPASS_EVAL_VERSION. */
const VERSION = process.env.COMPASS_EVAL_VERSION || requiredBookVersion();

let db: Client | null = null;
let ready = false;

describe.runIf(PG)("Ask-the-Book retrieval report", () => {
  beforeAll(async () => {
    db = new Client({ connectionString: PG });
    await db.connect();
    const r = await db.query(
      `select count(*) c from compass_book_sections where is_active and book_version = $1`,
      [VERSION],
    );
    ready = Number(r.rows[0].c) > 0;
  }, 60_000);

  afterAll(async () => {
    await db?.end();
  });

  it("prints a per-question retrieval report", async () => {
    if (!ready || !db) {
      console.log(`\n[skipped] no active corpus for version "${VERSION}".`);
      console.log(`Import the approved book source and re-run:`);
      console.log(`  npm run compass -- import <source.json> && npm run compass -- activate <version>\n`);
      return;
    }

    const total = Number(
      (
        await db.query(
          `select count(*) c from compass_book_sections where is_active and book_version = $1`,
          [VERSION],
        )
      ).rows[0].c,
    );

    console.log(`\ncorpus="${VERSION}" chunks=${total}  questions=${EVAL.questions.length}\n`);
    console.log(
      "id    | scope | hit | n | top score | dropped derived terms | retrieved sections",
    );
    console.log("-".repeat(120));

    let matchedInScope = 0;
    let inScope = 0;
    let leakedOutOfScope = 0;
    let outOfScope = 0;

    for (const q of EVAL.questions) {
      const { original, derived } = splitQueryTerms(q.q);
      const dfMap = new Map<string, number>();
      for (const t of [...original, ...derived]) {
        dfMap.set(
          t,
          Number(
            (
              await db.query(
                `select count(*) c from compass_book_sections
                  where is_active and book_version = $1 and search_tsv @@ to_tsquery('simple', $2)`,
                [VERSION, t],
              )
            ).rows[0].c,
          ),
        );
      }
      const kept = gateDerivedTerms(original, derived, dfMap, total);
      const dropped = derived.filter((t) => !kept.includes(t));

      const res = await searchCompass(db as never, q.q);
      const top = res.results[0]?.score ?? 0;
      const sections = res.results
        .map((r) => `ch${r.chapterNumber}«${r.sectionName ?? "-"}»`)
        .join(" ");

      if (q.outOfScope) {
        outOfScope++;
        if (res.matched) leakedOutOfScope++;
      } else {
        inScope++;
        if (res.matched) matchedInScope++;
      }

      console.log(
        [
          q.id.padEnd(5),
          (q.outOfScope ? "OUT" : "in ").padEnd(5),
          (res.matched ? "yes" : "NO ").padEnd(3),
          String(res.results.length).padEnd(1),
          top.toFixed(4).padEnd(9),
          (dropped.join(",") || "-").padEnd(21),
          sections || "(none)",
        ].join(" | "),
      );
      if (q.reported) console.log(`      ^ reported field failure: "${q.q}"`);
    }

    console.log("-".repeat(120));
    console.log(
      `in-scope retrieved something : ${matchedInScope}/${inScope} = ${((100 * matchedInScope) / Math.max(inScope, 1)).toFixed(0)}%`,
    );
    console.log(
      `out-of-scope correctly empty : ${outOfScope - leakedOutOfScope}/${outOfScope}`,
    );
    console.log(
      `\nNOTE: "retrieved something" is NOT answer quality. Classify each row by reading the\n` +
        `retrieved sections against the manuscript: DIRECTLY_GROUNDED / PRINCIPLE_GROUNDED /\n` +
        `CORRECTLY_DECLINED / FALSE_NEGATIVE / UNSUPPORTED. A row that retrieved five weakly\n` +
        `related chunks is a worse outcome than an honest decline.\n`,
    );
  }, 300_000);
});
