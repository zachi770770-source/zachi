/**
 * מתאם שליחת מיילים של ערכת-הקורא — ספק: Resend (REST, ללא תלות נוספת),
 * באותו דפוס כמו contactEmail. קונפיגורציה במשתני-סביבה בלבד (אין סודות בקוד):
 *
 * - RESEND_API_KEY     — מפתח Resend (סוד, שרת-בלבד).
 * - CONTACT_FROM_EMAIL — כתובת שולח מאומתת (משותפת עם „צור קשר”).
 *
 * עקרונות: לעולם לא מדווחים הצלחה אלא אם הספק אישר (2xx). לא רושמים ללוג
 * שם/אימייל/אסימון — רק קוד סטטוס לא-רגיש בכשל.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type ReaderEmailResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "delivery_failed" };

/** האם קיימת קונפיגורציה מספקת לשליחה (מפתח + שולח מאומת). */
export function isReaderEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL);
}

async function send(to: string, subject: string, text: string): Promise<ReaderEmailResult> {
  if (!isReaderEmailConfigured()) return { ok: false, reason: "not_configured" };
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL,
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) {
      console.error(`[reader] email provider responded ${res.status}`);
      return { ok: false, reason: "delivery_failed" };
    }
    return { ok: true };
  } catch {
    console.error("[reader] email provider request failed");
    return { ok: false, reason: "delivery_failed" };
  }
}

/** אישור קבלת בקשה (best-effort) — לא מצהיר על אימות, רק שקיבלנו את הבקשה. */
export function sendReaderClaimReceivedEmail(input: {
  to: string;
  name: string;
}): Promise<ReaderEmailResult> {
  const text = [
    `שלום ${input.name},`,
    "",
    "קיבלנו את הבקשה להפעיל את ערכת הכלים הדיגיטלית לקורא של „מדייטים לאהבה”.",
    "נעבור על הפרטים ונשלח לכם קישור גישה לאחר האישור.",
    "",
    "תודה,",
    "צוות מדייטים לאהבה",
  ].join("\n");
  return send(input.to, "קיבלנו את בקשת ההפעלה — ערכת הקורא", text);
}

/** מייל גישה לערכה — נשלח *רק* לאחר approval אמיתי, עם קישור-האסימון. */
export function sendReaderKitAccessEmail(input: {
  to: string;
  name: string;
  kitUrl: string;
}): Promise<ReaderEmailResult> {
  const text = [
    `שלום ${input.name},`,
    "",
    "אישרנו את הרכישה — ערכת הכלים הדיגיטלית לקורא פתוחה עבורכם:",
    input.kitUrl,
    "",
    "הקישור אישי; אין לשתף אותו.",
    "",
    "תודה,",
    "צוות מדייטים לאהבה",
  ].join("\n");
  return send(input.to, "ערכת הקורא פתוחה עבורכם", text);
}
