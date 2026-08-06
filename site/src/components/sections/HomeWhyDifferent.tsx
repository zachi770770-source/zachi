import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { bigIdea, outcomes } from "@/content/book";

/**
 * „למה הספר שונה” — שלושה יתרונות מעשיים וקישור לעמוד הספר. הטקסטים לקוחים
 * מתוכן מאושר קיים (src/content/book.ts: bigIdea.intro + שלושה מתוך outcomes),
 * ופרושים על-פני המסע (לפני קשר / בניית קשר / בתוך קשר) — ללא תוכן חדש.
 */
const BENEFITS = [
  // לפני קשר: הבחנה בין פסילה מפחד לחוסר-התאמה אמיתי.
  outcomes.items[0],
  // בניית קשר: איך אמון וקרבה נבנים בפועל.
  outcomes.items[5],
  // בתוך קשר: העמקה בלי ביטול-עצמי.
  outcomes.items[8],
];

export function HomeWhyDifferent() {
  return (
    <section
      id="why-different"
      className="scroll-mt-20 py-14 sm:py-16"
      aria-labelledby="why-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">כלים, לא רק רעיון</span>
          <h2 id="why-heading" className="type-h2 mt-4">
            למה הספר שונה
          </h2>
          <p className="type-lead mt-4 text-foreground-muted [text-wrap:pretty]">
            {bigIdea.intro}
          </p>
        </Reveal>

        <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          {BENEFITS.map((benefit, i) => (
            <li
              key={i}
              className="reveal flex flex-col rounded-2xl border border-border bg-surface p-6"
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand"
                aria-hidden="true"
              >
                <Check className="h-5 w-5" />
              </span>
              <p className="mt-4 text-[15.5px] leading-relaxed text-foreground [text-wrap:pretty]">
                {benefit}
              </p>
            </li>
          ))}
        </ul>

        <Reveal className="mt-8 text-center">
          <Link
            href="/book"
            className="group inline-flex items-center gap-2 text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            לעמוד הספר המלא
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
              aria-hidden="true"
            />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
