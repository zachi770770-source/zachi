import { NextResponse, type NextRequest } from "next/server";

import { contactSchema } from "@/lib/validation/contact";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendContactEmail } from "@/lib/email/contactEmail";

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

  // מדווחים הצלחה רק אם ספק המייל אישר מסירה. אין רישום ללוג של שם, הודעה,
  // אימייל או טלפון — רק סטטוס לא-רגיש בתוך המתאם.
  const result = await sendContactEmail({
    name: parsed.data.name,
    contact: parsed.data.contact,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  if (result.ok) {
    return NextResponse.json({ success: true });
  }

  if (result.reason === "not_configured") {
    return NextResponse.json(
      {
        error:
          "שירות שליחת ההודעות אינו זמין כרגע. אנא נסו שוב מאוחר יותר, או פנו אלינו בדרך חלופית.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "אירעה תקלה בשליחת ההודעה. נסו שוב בעוד רגע." },
    { status: 502 }
  );
}
