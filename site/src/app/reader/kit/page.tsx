import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { ViewEvent } from "@/components/analytics/ViewEvent";
import { ReaderResourceLink } from "@/components/reader/ReaderResourceLink";
import { readerKitGroups, readerSeriesDays, readerKitOffer } from "@/content/readerKit";
import { getReaderClaimRepository } from "@/lib/reader";
import { hashAccessToken, isValidAccessTokenShape } from "@/lib/reader/token";

// שער-כניסה מוגן + קורא עוגייה/DB → תמיד דינמי, ולעולם לא נאינדקס (פרטי).
export const dynamic = "force-dynamic";

const SESSION_COOKIE = "reader_session";

export const metadata: Metadata = {
  title: "ערכת הקורא | מדייטים לאהבה",
  robots: { index: false, follow: false },
};

/**
 * אימות סשן מול העוגייה בלבד — אין אסימון ב-URL. מגבבים את ערך-העוגייה ומחפשים
 * הפעלה *מאושרת* שאסימונה תקף. תשובה אחידה בכשל — ללא enumeration.
 */
async function hasAccess(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!isValidAccessTokenShape(token)) return false;
  const repo = getReaderClaimRepository();
  if (!repo) return false;
  try {
    const claim = await repo.findApprovedByAccessTokenHash(hashAccessToken(token));
    return Boolean(claim);
  } catch {
    return false;
  }
}

export default async function ReaderKitPage() {
  const allowed = await hasAccess();

  if (!allowed) {
    // מצב „אין גישה” אחיד — לא חושף אם קיים סשן/פג. אין תוכן-ערכה.
    return (
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-[46ch] text-center">
          <span className="kicker justify-center">ערכת הקורא</span>
          <h1 className="mt-4 font-serif text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.15] text-foreground [text-wrap:balance]">
            הגישה לערכה אישית
          </h1>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-foreground-muted [text-wrap:pretty]">
            הקישור לערכה נשלח במייל לאחר אישור הרכישה. אם עדיין לא אישרנו, או
            שהקישור פג, אפשר להגיש שוב את הבקשה כאן.
          </p>
          <div className="mt-6">
            <Link
              href="/reader#activate"
              className="group inline-flex items-center gap-2 text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              להפעלת ערכת הקורא
              <ArrowLeft className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      {/* קורא מאושר הגיע לערכה — סמן במשפך. */}
      <ViewEvent event="reader_bonus_approved" />
      <ViewEvent event="reader_kit_accessed" />

      <header className="max-w-[52ch]">
        <span className="kicker">{readerKitOffer.eyebrow}</span>
        <h1 className="mt-4 font-serif text-[clamp(1.8rem,3.4vw,2.6rem)] font-bold leading-[1.1] text-foreground [text-wrap:balance]">
          ערכת הכלים שלכם
        </h1>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-foreground-muted [text-wrap:pretty]">
          אותם כלים מהספר, מסודרים לפי מה שאתם צריכים ברגע נתון. פתחו כלי כשצריך
          אותו — אחרי דייט, לפני שיחה, או כשהראש מתחיל למלא את השקט.
        </p>
      </header>

      <div className="mt-12 space-y-12">
        {readerKitGroups.map((group) => (
          <section key={group.id} aria-labelledby={`kit-${group.id}`} className="reveal">
            <h2
              id={`kit-${group.id}`}
              className="font-serif text-[clamp(1.35rem,2.2vw,1.85rem)] font-bold leading-[1.2] text-foreground"
            >
              {group.need}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {group.resources.map((r) => (
                <ReaderResourceLink
                  key={r.id}
                  id={r.id}
                  href={r.href}
                  title={r.title}
                  summary={r.summary}
                />
              ))}
            </div>
          </section>
        ))}

        {/* מסלול 7 ימים — לקריאה עצמית על העמוד, בקצב שלכם. אין כאן סדרת
            אימיילים אוטומטית (עוד אין scheduler) — התוכן זמין לקריאה כאן. */}
        <section id="seven-days" aria-labelledby="kit-seven-days" className="reveal border-t border-border pt-10 scroll-mt-24">
          <h2 id="kit-seven-days" className="font-serif text-[clamp(1.35rem,2.2vw,1.85rem)] font-bold leading-[1.2] text-foreground">
            מסלול 7 ימים לבהירות
          </h2>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
            מסלול לקריאה עצמית: כל יום כלי אחד מהספר ופעולה קטנה אחת. עוברים בקצב
            שלכם, כאן על העמוד.
          </p>
          <ol className="mt-5 flex flex-col divide-y divide-border">
            {readerSeriesDays.map((d) => (
              <li key={d.day} className="py-4 first:pt-0">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-[1.25rem] font-bold text-brand/85">
                    {String(d.day).padStart(2, "0")}
                  </span>
                  <Link
                    href={d.href}
                    className="font-serif text-[16px] font-semibold text-foreground underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  >
                    {d.title}
                  </Link>
                </div>
                <p className="mt-1.5 ps-9 text-[15px] leading-relaxed text-foreground/90 [text-wrap:pretty]">
                  {d.idea}
                </p>
                <p className="mt-1 ps-9 text-[14px] leading-relaxed text-brand-hover [text-wrap:pretty]">
                  פעולה קטנה: {d.action}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Container>
  );
}
