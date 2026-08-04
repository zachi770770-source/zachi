import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { closing } from "@/content/book";

/**
 * ציטוט עריכתי חזק בין סקשן התזה לבין מסע התחנות. משתמש במשפט קיים ומאושר
 * מתוך תוכן הספר (closing.title) — כרעיון מהספר, לא כהמלצה/עדות חברתית.
 * ללא מוטיב, ללא קלף, ללא אנימציה חדשה — נעטף ב-Reveal הקיים כמו שאר
 * הסקשנים (עקביות עם מערכת התנועה המאושרת).
 */
export function BookPullQuote() {
  return (
    <section aria-label="רעיון מתוך הספר" className="py-16 sm:py-20">
      <Container>
        <Reveal className="mx-auto max-w-3xl text-center">
          <figure>
            <blockquote className="build-text font-serif text-[1.55rem] font-medium leading-[1.5] text-foreground sm:text-[2rem]">
              {closing.title}
            </blockquote>
            <figcaption className="mt-5 text-[12.5px] font-semibold uppercase tracking-[0.16em] text-brand-hover">
              מתוך הספר
            </figcaption>
          </figure>
        </Reveal>
      </Container>
    </section>
  );
}
