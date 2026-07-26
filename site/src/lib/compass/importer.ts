import { createHash } from "node:crypto";

import type { BookSource, SqlClient } from "@/lib/compass/types";
import { chunkBook } from "@/lib/compass/chunker";
import { ensureCompassSchema } from "@/lib/compass/schema";

/**
 * ייבוא/עדכון/ביטול/בנייה-מחדש של גרסאות הספר. מודול ניהול בצד השרת/CLI
 * בלבד — אינו מיובא ע"י אף רכיב, ולכן אינו נחשף לדפדפן. ההגנה בזמן ריצה על
 * תוכן הספר היא DATABASE_URL בצד שרת בלבד + RLS/revoke על הטבלאות.
 *
 * חשוב: הפעולות הטרנזקציוניות (import/activate/rollback) חייבות לקבל חיבור
 * יחיד ייעודי (pool.connect()), לא Pool — כדי ש-BEGIN/COMMIT/ROLLBACK ירוצו
 * על אותו חיבור. הסקריפט (scripts/compass.ts) דואג לכך.
 *
 * עקרון מפתח: רק גרסה אחת פעילה בכל רגע (נאכף גם ב-DB), כך שתשובת חיפוש
 * לעולם לא מערבבת גרסאות. כישלון בייבוא מגלגל אחורה (rollback) ולא משאיר
 * גרסה חלקית פעילה.
 */

function sourceChecksum(source: BookSource): string {
  return createHash("sha256")
    .update(JSON.stringify(source), "utf8")
    .digest("hex");
}

export interface ImportResult {
  version: string;
  sectionCount: number;
}

/** מייבא גרסה חדשה (או מייבא-מחדש קיימת) כ-inactive. אטומי; rollback בכישלון. */
export async function importVersion(
  db: SqlClient,
  source: BookSource
): Promise<ImportResult> {
  if (!source.version) throw new Error("book source is missing a version id");
  await ensureCompassSchema(db);

  const chunks = chunkBook(source);
  if (chunks.length === 0) throw new Error("book source produced no sections");
  const checksum = sourceChecksum(source);

  await db.query("begin");
  try {
    // סימון הגרסה כ-importing (מאפס ייבוא קודם של אותה גרסה).
    await db.query(
      `insert into compass_book_versions (version, status, section_count, source_checksum, updated_at)
         values ($1, 'importing', 0, $2, now())
       on conflict (version) do update
         set status = 'importing', section_count = 0,
             source_checksum = excluded.source_checksum, updated_at = now()`,
      [source.version, checksum]
    );
    // מחיקת קטעים קודמים של אותה גרסה (ייבוא-מחדש נקי).
    await db.query(`delete from compass_book_sections where book_version = $1`, [
      source.version,
    ]);

    for (const c of chunks) {
      await db.query(
        `insert into compass_book_sections
           (book_version, chapter_number, chapter_name, section_name,
            section_order, content, checksum, is_active)
         values ($1, $2, $3, $4, $5, $6, $7, false)`,
        [
          c.bookVersion,
          c.chapterNumber,
          c.chapterName,
          c.sectionName,
          c.sectionOrder,
          c.content,
          c.checksum,
        ]
      );
    }

    await db.query(
      `update compass_book_versions
          set status = 'inactive', section_count = $2, updated_at = now()
        where version = $1`,
      [source.version, chunks.length]
    );
    await db.query("commit");
    return { version: source.version, sectionCount: chunks.length };
  } catch (err) {
    await db.query("rollback").catch(() => {});
    // סימון כישלון (best-effort, מחוץ לטרנזקציה שגולגלה).
    await db
      .query(
        `insert into compass_book_versions (version, status, updated_at)
           values ($1, 'failed', now())
         on conflict (version) do update set status = 'failed', updated_at = now()`,
        [source.version]
      )
      .catch(() => {});
    throw err;
  }
}

/**
 * מפעיל גרסה: מכבה כל גרסה/קטע פעילים ומדליק את היעד — אטומית. כך שאין
 * רגע שבו שתי גרסאות פעילות (ערבוב גרסאות נמנע).
 */
export async function activateVersion(db: SqlClient, version: string): Promise<void> {
  await db.query("begin");
  try {
    const exists = await db.query(
      `select status from compass_book_versions where version = $1`,
      [version]
    );
    const status = (exists.rows[0] as { status?: string } | undefined)?.status;
    if (!status) throw new Error("version not found");
    if (status === "importing" || status === "failed") {
      throw new Error(`version is not importable (status: ${status})`);
    }

    await db.query(
      `update compass_book_versions set status = 'inactive', updated_at = now()
        where status = 'active' and version <> $1`,
      [version]
    );
    await db.query(
      `update compass_book_sections set is_active = false, updated_at = now()
        where book_version <> $1 and is_active`,
      [version]
    );
    await db.query(
      `update compass_book_sections set is_active = true, updated_at = now()
        where book_version = $1`,
      [version]
    );
    await db.query(
      `update compass_book_versions
          set status = 'active', activated_at = now(), updated_at = now()
        where version = $1`,
      [version]
    );
    await db.query("commit");
  } catch (err) {
    await db.query("rollback").catch(() => {});
    throw err;
  }
}

/** מבטל הפעלה של גרסה (הופך ל-inactive). אם הייתה פעילה — לא נשארת גרסה פעילה. */
export async function deactivateVersion(db: SqlClient, version: string): Promise<void> {
  await db.query("begin");
  try {
    await db.query(
      `update compass_book_sections set is_active = false, updated_at = now()
        where book_version = $1`,
      [version]
    );
    await db.query(
      `update compass_book_versions set status = 'inactive', updated_at = now()
        where version = $1 and status = 'active'`,
      [version]
    );
    await db.query("commit");
  } catch (err) {
    await db.query("rollback").catch(() => {});
    throw err;
  }
}

/** rollback: מפעיל מחדש גרסה קודמת נתונה (למשל אחרי הפעלה שגויה). */
export async function rollbackToVersion(db: SqlClient, previousVersion: string): Promise<void> {
  await activateVersion(db, previousVersion);
}

/** בנייה מחדש של אינדקס החיפוש (GIN). ה-tsvector עצמו generated ומתעדכן לבד. */
export async function rebuildSearchIndex(db: SqlClient): Promise<void> {
  await db.query(`reindex index compass_sections_tsv_idx`);
}

/** רשימת גרסאות — לניהול בלבד (שרת), לא חושף תוכן קטעים. */
export async function listVersions(
  db: SqlClient
): Promise<Array<{ version: string; status: string; sectionCount: number }>> {
  const res = await db.query(
    `select version, status, section_count from compass_book_versions
      order by imported_at desc`
  );
  return (res.rows as Array<{ version: string; status: string; section_count: number }>).map(
    (r) => ({ version: r.version, status: r.status, sectionCount: r.section_count })
  );
}
