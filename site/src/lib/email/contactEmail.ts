/**
 * מתאם שליחת מייל לפניות „צור קשר”. ספק: Resend דרך ה-REST API (ללא תלות
 * נוספת). כל הקונפיגורציה במשתני סביבה בלבד — אין סודות בקוד:
 *
 * - RESEND_API_KEY     — מפתח ה-API של Resend (סוד).
 * - CONTACT_FROM_EMAIL — כתובת שולח מאומתת ב-Resend (דומיין מאומת).
 * - CONTACT_TO_EMAIL   — היעד שאליו מגיעות הפניות.
 *
 * עקרונות: לעולם לא מדווחים הצלחה אלא אם הספק אישר מסירה (2xx). לעולם לא
 * רושמים ללוג שם, הודעה, אימייל או טלפון — רק קוד סטטוס לא-רגיש בכשל.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type ContactEmailInput = {
  name: string;
  contact: string;
  subject: string;
  message: string;
};

export type ContactEmailResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "delivery_failed" };

/** האם כל שלושת משתני הסביבה הדרושים לשליחה קיימים. */
export function isContactEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.CONTACT_FROM_EMAIL &&
      process.env.CONTACT_TO_EMAIL
  );
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function sendContactEmail(
  input: ContactEmailInput
): Promise<ContactEmailResult> {
  if (!isContactEmailConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  // Reply-To רק כשפרטי הקשר הם אימייל תקין; ערך הקשר תמיד מופיע בגוף ההודעה
  // (נשלח ליעד — אין בכך „לוגינג” של PII).
  const replyTo = looksLikeEmail(input.contact) ? input.contact : undefined;
  const text = [
    `שם: ${input.name}`,
    `פרטי יצירת קשר: ${input.contact}`,
    `נושא: ${input.subject}`,
    "",
    input.message,
  ].join("\n");

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL,
        to: [process.env.CONTACT_TO_EMAIL],
        subject: `[צור קשר] ${input.subject}`,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      // לוג לא-רגיש בלבד: קוד סטטוס, בלי גוף התגובה ובלי שום PII.
      console.error(`[contact] email provider responded ${res.status}`);
      return { ok: false, reason: "delivery_failed" };
    }
    return { ok: true };
  } catch {
    // ללא פרטי חריגה (עלולים להכיל כתובות/מידע) — הודעה גנרית בלבד.
    console.error("[contact] email provider request failed");
    return { ok: false, reason: "delivery_failed" };
  }
}
