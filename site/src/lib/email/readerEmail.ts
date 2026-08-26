/**
 * מתאם שליחת מיילים של ערכת-הקורא — ספק: Resend (REST, ללא תלות נוספת),
 * באותו דפוס כמו contactEmail. קונפיגורציה במשתני-סביבה בלבד (אין סודות בקוד):
 *
 * - RESEND_API_KEY     — מפתח Resend (סוד, שרת-בלבד).
 * - CONTACT_FROM_EMAIL — כתובת שולח מאומתת (משותפת עם „צור קשר”).
 *
 * עקרונות: לעולם לא מדווחים הצלחה אלא אם הספק אישר (2xx). לא רושמים ללוג
 * אימייל/אסימון — רק קוד סטטוס לא-רגיש בכשל. המייל אינו נושא אסימון-סשן
 * (הגישה דרך העוגייה במכשיר; קישור המייל אינו כולל token).
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

/**
 * אישור הפעלה (best-effort) — הגישה כבר נפתחה במכשיר דרך העוגייה. המייל מאשר
 * את ההפעלה ומאפשר חזרה מאוחר יותר; אם פותחים במכשיר אחר, מפעילים שוב עם הקוד.
 * `kitUrl` אינו נושא אסימון — הגישה נשענת על העוגייה, לא על ה-URL.
 */
export function sendReaderKitWelcomeEmail(input: {
  to: string;
  kitUrl: string;
  activateUrl: string;
}): Promise<ReaderEmailResult> {
  const text = [
    "שלום,",
    "",
    "ערכת הכלים הדיגיטלית לקורא של „מדייטים לאהבה” הופעלה עבורכם.",
    "לפתיחת הערכה במכשיר שבו הפעלתם:",
    input.kitUrl,
    "",
    "פותחים במכשיר אחר? הזינו שוב את הקוד מהספר כאן:",
    input.activateUrl,
    "",
    "תודה,",
    "צוות מדייטים לאהבה",
  ].join("\n");
  return send(input.to, "ערכת הקורא הופעלה", text);
}
