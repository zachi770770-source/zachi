import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { readerKitOffer, readerKitGroups } from "@/content/readerKit";
import { Button } from "@/components/ui/button";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";

/**
 * הצעת-הערך של ערכת-הקורא — „יותר מספר. כלים שעוזרים להפוך קריאה ליישום.”
 * מקור-אמת אחד (readerKit) לשתי נקודות-מכירה:
 *   variant="full" (עמוד /reader) — כולל CTA רכישה ראשי + הפעלה למי שכבר רכש.
 *   variant="link" (עמוד /book)    — סקשן קומפקטי שמפנה ל-/reader (בלי CTA-אמזון
 *                                    שני שמתחרה ב-CTA הקיים של העמוד).
 * מציג את הכלים מאורגנים לפי צורך — לא רשימת קבצים. אין מחיר-שווי/מחיקות/scarcity.
 */
export function ReaderKitOffer({
  variant = "full",
  amazonSource = "reader",
}: {
  variant?: "full" | "link";
  amazonSource?: "reader" | "book";
}) {
  return (
    <section
      aria-labelledby="reader-kit-offer-heading"
      className="reveal rounded-3xl border border-border bg-surface-muted/50 px-6 py-9 sm:px-10 sm:py-11"
    >
      <span className="kicker">{readerKitOffer.eyebrow}</span>
      <h2
        id="reader-kit-offer-heading"
        className="mt-3 font-serif text-[clamp(1.5rem,2.6vw,2.1rem)] font-bold leading-[1.15] text-foreground [text-wrap:balance]"
      >
        {readerKitOffer.title}
      </h2>
      <p className="mt-3 max-w-[58ch] text-[1.0625rem] leading-relaxed text-foreground/90 [text-wrap:pretty]">
        {readerKitOffer.lead}
      </p>

      {/* מה כלול — לפי צורך, לא רשימת קבצים. */}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {readerKitGroups.map((group) => (
          <li key={group.id} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand-hover">
              {group.need}
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {group.resources.map((r) => (
                <li
                  key={r.id}
                  className="text-[15px] leading-snug text-foreground/90 [text-wrap:pretty]"
                >
                  {r.title}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[15px] font-semibold text-foreground">
        {readerKitOffer.includedLine}
      </p>

      {variant === "full" ? (
        <div className="mt-5 flex flex-col items-start gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <AmazonBuyLink source={amazonSource}>
              לקניית הספר באמזון
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </AmazonBuyLink>
          </Button>
          <p className="text-[14px] text-foreground-muted [text-wrap:pretty]">
            {readerKitOffer.ctaSubline}
          </p>
          <Link
            href="/reader#activate"
            className="mt-1 inline-flex items-center gap-2 text-[15px] font-medium text-foreground underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {readerKitOffer.activateLabel}
            <ArrowLeft className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="mt-5">
          <Link
            href="/reader"
            className="group inline-flex items-center gap-2 text-[16px] font-semibold text-foreground underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            לכל מה שכלול בערכת הקורא
            <ArrowLeft
              className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      )}
    </section>
  );
}
