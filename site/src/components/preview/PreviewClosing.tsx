import Link from "next/link";
import { ArrowLeft, Check, Compass } from "lucide-react";

import { siteConfig } from "@/config/site";
import { previewClosing } from "@/content/sample";
import { waitlistPage } from "@/content/stations";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { BookLink } from "@/components/shared/BookLink";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

/**
 * אזור סיום לעמוד ההצצה: מחבר את הטעימה לספר המלא, עם פעולה ראשית אחת בלבד
 * (הצטרפות לרשימת ההמתנה בטרום-השקה, או רכישה כשהמכירה פתוחה), הסבר קצר מה
 * מקבלים, וקישור משני ל-/book. אין באזור יותר מפעולה ראשית אחת.
 */
export function PreviewClosing() {
  const salesOpen = siteConfig.salesOpen;

  return (
    <section
      id="join"
      className="scroll-mt-20 bg-surface-muted py-16 sm:py-20"
      aria-labelledby="preview-closing-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface px-6 py-10 sm:px-10 sm:py-12">
          <div className="text-center">
            <span className="kicker justify-center">{previewClosing.eyebrow}</span>
            <h2 id="preview-closing-heading" className="type-h2 mt-4">
              {previewClosing.title}
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-[17px] leading-relaxed text-foreground-muted">
              {previewClosing.connect}
            </p>
          </div>

          {salesOpen ? (
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <BookLink href="/book#purchase">
                  לרכישת הספר
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </BookLink>
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] sm:items-start">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                  {waitlistPage.whatYouGetTitle}
                </h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {waitlistPage.whatYouGet.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-hover"
                        aria-hidden="true"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[15px] leading-relaxed text-foreground/90">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-4 text-[15px] leading-relaxed text-foreground-muted">
                  {previewClosing.waitlistLead}
                </p>
                <WaitlistForm source="preview" />
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-4 border-t border-border pt-6 text-center">
            <BookLink
              href="/book"
              className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {previewClosing.bookLinkLabel}
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                aria-hidden="true"
              />
            </BookLink>
            {/* מעבר ברור למצפן — לקורא שסיים את הטעימה ולא בטוח מאיפה להתחיל. */}
            <Link
              href="/compass"
              className="group inline-flex items-center gap-2 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <Compass className="h-4 w-4 text-brand" aria-hidden="true" />
              {previewClosing.compassLinkLabel}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
