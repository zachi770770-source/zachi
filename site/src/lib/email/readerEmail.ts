/**
 * מתאם שליחת מיילים של ערכת-הקורא — ספק: Resend (REST, ללא תלות נוספת),
 * באותו דפוס כמו contactEmail. קונפיגורציה במשתני-סביבה בלבד (אין סודות בקוד):
 *
 * - RESEND_API_KEY     — מפתח Resend (סוד, שרת-בלבד).
 * - CONTACT_FROM_EMAIL — כתובת שולח מאומתת (משותפת עם „צור קשר”).
 *
 * עקרונות: לעולם לא מדווחים הצלחה אלא אם הספק אישר (2xx). לא רושמים ללוג
 * אימייל/אסימון — רק קוד סטטוס לא-רגיש בכשל.
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

/** אישור קבלת בקשה (best-effort) — לא מצהיר על אימות, רק שקיבלנו את הבקשה לבדיקה. */
export function sendReaderClaimReceivedEmail(input: { to: string }): Promise<ReaderEmailResult> {
  const text = [
    "שלום,",
    "",
    "קיבלנו את הבקשה להפעיל את ערכת הכלים הדיגיטלית לקורא של „מדייטים לאהבה”,",
    "יחד עם הוכחת הרכישה. נעבור עליה ונשלח לכם קישור גישה לאחר האישור.",
    "",
    "תודה,",
    "צוות מדייטים לאהבה",
  ].join("\n");
  return send(input.to, "קיבלנו את בקשת ההפעלה — ערכת הקורא", text);
}

/**
 * מייל גישה — נשלח *רק* לאחר approval אמיתי. הקישור מוביל ל-/api/reader/enter
 * עם אסימון חד-פעמי שמוחלף לעוגיית-סשן HttpOnly, כך שה-URL של הערכה עצמה נשאר
 * נקי מאסימון.
 */
export function sendReaderKitAccessEmail(input: {
  to: string;
  enterUrl: string;
}): Promise<ReaderEmailResult> {
  const text = [
    "שלום,",
    "",
    "אישרנו את הרכישה — ערכת הכלים הדיגיטלית לקורא פתוחה עבורכם.",
    "לפתיחת הגישה (הקישור אישי; אין לשתף אותו):",
    input.enterUrl,
    "",
    "תודה,",
    "צוות מדייטים לאהבה",
  ].join("\n");
  return send(input.to, "ערכת הקורא פתוחה עבורכם", text);
}
