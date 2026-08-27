import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { ViewEvent } from "@/components/analytics/ViewEvent";
import { ReaderClaimForm } from "@/components/reader/ReaderClaimForm";
import { readerKitOffer, readerKitGroups } from "@/content/readerKit";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "ערכת הכלים הדיגיטלית לקורא | מדייטים לאהבה",
  description:
    "לרוכשי „מדייטים לאהבה” — ערכת כלים דיגיטלית שהופכת את הכלים שבספר ליישום מעשי בחיי הדייטינג והזוגיות. כלול ללא תשלום נוסף.",
  path: "/reader",
  ogType: "website",
  absoluteTitle: true,
});

export default function ReaderPage() {
  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <ViewEvent event="reader_bonus_view" />

      <nav aria-label="פירורי לחם" className="text-sm text-foreground-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href="/"
              className="rounded-sm underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              בית
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-foreground">
            ערכת הקורא
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="enter-stagger mt-8 max-w-[46ch] lg:mt-12">
        <span className="kicker">{readerKitOffer.eyebrow}</span>
        <h1 className="mt-5 font-serif text-[clamp(2rem,4.2vw,3.2rem)] font-bold leading-[1.1] tracking-[-0.01em] text-foreground [text-wrap:balance]">
          {readerKitOffer.title}
        </h1>
        <p className="mt-6 text-[clamp(1.1rem,1.5vw,1.3125rem)] leading-relaxed text-foreground-muted [text-wrap:pretty]">
          {readerKitOffer.lead}
        </p>
      </header>

      <div className="mt-14 space-y-14 lg:mt-20 lg:space-y-20">
        {/* מה כלול — לפי צורך */}
        <section aria-labelledby="reader-included" className="reveal">
          <h2 id="reader-included" className="font-serif text-[clamp(1.5rem,2.4vw,2.05rem)] font-bold leading-[1.15] text-foreground">
            מה כלול בערכה
          </h2>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
            הכלים מאורגנים לפי מה שאתם צריכים ברגע נתון — לא רשימת קבצים.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {readerKitGroups.map((group) => (
              <li key={group.id} className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand-hover">
                  {group.need}
                </p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {group.resources.map((r) => (
                    <li key={r.id}>
                      <span className="font-serif text-[15px] font-semibold text-foreground">
                        {r.title}
                      </span>
                      <span className="mt-0.5 block text-[14px] leading-relaxed text-foreground/80 [text-wrap:pretty]">
                        {r.summary}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        {/* איך זה משלים את הספר */}
        <section aria-labelledby="reader-complements" className="reveal border-t border-border pt-10">
          <h2 id="reader-complements" className="font-serif text-[clamp(1.5rem,2.4vw,2.05rem)] font-bold leading-[1.15] text-foreground">
            איך זה משלים את הספר
          </h2>
          <p className="mt-3 max-w-[60ch] text-[1.0625rem] leading-relaxed text-foreground/90 [text-wrap:pretty]">
            הספר הוא הידע — הגישה, המושגים והשיטה. ערכת הקורא הופכת אותו ליישום:
            אותם כלים בדיוק, בפורמט קצר שאפשר לפתוח אחרי דייט, לפני שיחה, או כשהראש
            מתחיל למלא את השקט בסיפורים. הבונוסים הם הרחבה מעשית של השיטה, לא אוסף
            מתנות.
          </p>
        </section>

        {/* CTA — הספר באמזון (ראשי) + הבהרה שהערכה כלולה */}
        <section aria-labelledby="reader-buy" className="reveal rounded-3xl border border-border bg-surface-muted/60 px-6 py-9 text-center sm:px-10 sm:py-11">
          <h2 id="reader-buy" className="mx-auto max-w-[36ch] font-serif text-[clamp(1.3rem,2vw,1.75rem)] font-bold leading-[1.2] text-foreground [text-wrap:balance]">
            קונים את „מדייטים לאהבה”, ומקבלים גם את ערכת הקורא.
          </h2>
          <p className="mx-auto mt-3 max-w-[42ch] text-[15px] font-semibold text-foreground">
            {readerKitOffer.includedLine}
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <AmazonBuyLink source="reader">
                לקניית הספר באמזון
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </AmazonBuyLink>
            </Button>
          </div>
          <p className="mt-3 text-[14px] text-foreground-muted [text-wrap:pretty]">
            {readerKitOffer.ctaSubline}
          </p>
        </section>

        {/* הפעלה למי שכבר רכש */}
        <section id="activate" aria-labelledby="reader-activate" className="reveal border-t border-border pt-10 scroll-mt-24">
          <h2 id="reader-activate" className="font-serif text-[clamp(1.5rem,2.4vw,2.05rem)] font-bold leading-[1.15] text-foreground">
            כבר רכשתם? הפעילו את ערכת הקורא
          </h2>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
            השאירו אימייל וצרפו הוכחת רכישה (צילום-מסך או PDF של אישור הרכישה
            מאמזון). נעבור על הבקשה ידנית ונשלח קישור גישה במייל לאחר האישור.
            הבקשה נשמרת במצב בדיקה עד לאישור — לא מוצג „מאומת” לפני כן.
          </p>
          <div className="mt-6 max-w-[34rem]">
            <ReaderClaimForm />
          </div>
        </section>
      </div>
    </Container>
  );
}
