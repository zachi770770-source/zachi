import { NextResponse, type NextRequest } from "next/server";

import { newsletterSchema } from "@/lib/validation/newsletter";
import { getNewsletterProvider } from "@/lib/newsletter/provider";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`newsletter:${ip}`, {
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

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (parsed.data.website) {
    // מולכד honeypot - מתנהגים כאילו הצליח כדי לא לרמז לבוט שזוהה.
    return NextResponse.json({ success: true });
  }

  await getNewsletterProvider().subscribe({
    firstName: parsed.data.firstName,
    email: parsed.data.email,
    marketingConsent: parsed.data.marketingConsent,
  });

  return NextResponse.json({ success: true });
}
