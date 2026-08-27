/**
 * אימות הוכחת-הרכישה שהקורא מעלה (צילום-מסך / תמונה / PDF). אימות *אמיתי*:
 * לא סומכים על ה-MIME שהדפדפן הצהיר עליו — בודקים את חתימת-הבתים (magic bytes)
 * ומוודאים גודל. הקובץ עצמו נשמר פרטי בשרת (Postgres bytea), לעולם לא כ-URL ציבורי.
 */

/** תקרת-גודל להוכחת-רכישה: 5MB. מספיק לצילום-מסך/תמונה/PDF, וחוסם ניצול. */
export const READER_PROOF_MAX_BYTES = 5 * 1024 * 1024;

/** סוגי-קובץ מותרים (לאחר sniff), עם סיומת מייצגת. */
export const READER_PROOF_ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export type ReaderProofMime = (typeof READER_PROOF_ALLOWED_MIME)[number];

export type ProofValidation =
  | { ok: true; mime: ReaderProofMime }
  | { ok: false; reason: "empty" | "too_large" | "unsupported_type" };

/**
 * מזהה את סוג-הקובץ לפי חתימת-הבתים בלבד (לא לפי ההצהרה של הדפדפן):
 *  PNG  89 50 4E 47 · JPEG FF D8 FF · WEBP "RIFF"…"WEBP" · PDF "%PDF-"
 * מחזיר את ה-MIME המזוהה, או null אם אינו אחד מהמותרים.
 */
export function sniffProofMime(bytes: Uint8Array): ReaderProofMime | null {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return "image/png";
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // "RIFF"
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // "WEBP"
  ) {
    return "image/webp";
  }
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) {
    return "application/pdf"; // "%PDF-"
  }
  return null;
}

/** אימות מלא: לא ריק, לא גדול מדי, וסוג-קובץ מזוהה ומותר. */
export function validateProof(bytes: Uint8Array): ProofValidation {
  if (bytes.length === 0) return { ok: false, reason: "empty" };
  if (bytes.length > READER_PROOF_MAX_BYTES) return { ok: false, reason: "too_large" };
  const mime = sniffProofMime(bytes);
  if (!mime) return { ok: false, reason: "unsupported_type" };
  return { ok: true, mime };
}
