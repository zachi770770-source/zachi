import { NextResponse, type NextRequest } from "next/server";

import { contactSchema } from "@/lib/validation/contact";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`contact:${ip}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "יותר מדי בקשות. נסו שוב בעוד דקה." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (parsed.data.website) {
    // מולכד honeypot - מתנהגים כאילו ההודעה נשלחה כדי לא לרמז לבוט שזוהה.
    return NextResponse.json({ success: true });
  }

  /**
   * אין כרגע ספק שליחת מייל מחובר. הפנייה נרשמת ליומן השרת לצורך
   * הדגמה בלבד. לפני עלייה לפרודקשן, יש לחבר כאן שירות שליחת מייל
   * אמיתי (למשל Resend / Postmark / SMTP) כדי שהפנייה תגיע בפועל.
   * אין רושמים שם, נושא או פרטי קשר - הם עלולים להכיל מידע מזהה.
   */
  console.log("[contact] פנייה חדשה (לא נשלחה בפועל - יש לחבר ספק מייל)");

  return NextResponse.json({ success: true });
}
