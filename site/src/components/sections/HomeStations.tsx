import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { stations as stationContent } from "@/content/stations";

/**
 * האזור היחיד בדף הבית שמציג את מבנה המסע: „שלוש תחנות ושער מעבר אחד”. ארבעה
 * כרטיסים קומפקטיים — כותרת, שורה אחת, וקישור HTML אמיתי לעמוד התחנה. אין כאן
 * שאלון, אין CTA לרשימת המתנה, ואין טקסטים ארוכים. „אחרי פרידה” הוא שער מעבר,
 * לא תחנה רביעית; „פרק ב’” הוא שכבת הקשר בתוך התחנות ואינו מוצג כתחנה מקבילה.
 */
const CARDS = [
  { id: "before-relationship", line: "חיפוש, דייטים ובחירה." },
  { id: "building-relationship", line: "מהיכרות לקשר שיש לו בסיס." },
  { id: "inside-relationship", line: "להבין דפוסים, לתקן ולחזק." },
  {
    id: "after-breakup",
    line: "שער מעבר — להבין לפני שמחליטים לאן ממשיכים.",
  },
] as const;

export function HomeStations() {
  return (
    <section
      id="stations"
      className="scroll-mt-20 py-12 sm:py-14"
      aria-labelledby="stations-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 id="stations-heading" className="type-h2">
            שלוש תחנות ושער מעבר אחד
          </h2>
        </Reveal>

        <div className="mx-auto mt-8 grid max-w-4xl gap-3.5 sm:grid-cols-2">
          {CARDS.map(({ id, line }) => {
            const s = stationContent[id];
            return (
              <Link
                key={id}
                href={`/${id}`}
                className="reveal group flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4 text-start transition-colors hover:border-brand/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="min-w-0">
                  <span className="block font-serif text-[1.15rem] font-semibold text-foreground">
                    {s.navLabel}
                  </span>
                  <span className="mt-1 block text-[14.5px] leading-snug text-foreground-muted [text-wrap:pretty]">
                    {line}
                  </span>
                </span>
                <ArrowLeft
                  className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
