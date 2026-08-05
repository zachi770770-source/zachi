import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { readiness, patterns } from "@/content/book";

/**
 * „למה אנחנו נתקעים” — שאלת המוכנות (מזיזה את הפוקוס פנימה) והדפוסים הלא-מודעים.
 * ממוקם ב-/book אחרי „למי הספר” ולפני „השיטה”: זיהוי-עצמי לפני הפתרון. הטבלה
 * היא טבלה בדסקטופ וכרטיסים מוערכים במובייל (אותו תוכן, ללא גלילה אופקית).
 */
export function PatternsSection() {
  return (
    <section
      id="patterns"
      className="scroll-mt-20 border-y border-border bg-surface-muted/40 py-24 sm:py-32"
      aria-labelledby="patterns-heading"
    >
      <Container>
        {/* שאלת המוכנות — ציטוט + השאלה שמזיזה את הפוקוס פנימה */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">{readiness.kicker}</span>
          <blockquote className="type-quote mt-6 text-[clamp(1.25rem,2.6vw,1.65rem)] italic leading-snug text-foreground">
            „{readiness.quote}”
          </blockquote>
          <p className="mt-8 font-serif text-[clamp(1.5rem,3.4vw,2.15rem)] font-semibold leading-tight text-brand-hover">
            {readiness.question}
          </p>
          <p className="type-lead mt-4 text-foreground-muted">{readiness.framing}</p>
        </Reveal>

        {/* הדפוסים הלא מודעים — טבלה/כרטיסים */}
        <Reveal className="mx-auto mt-16 max-w-3xl sm:mt-20">
          <span className="kicker justify-center">{patterns.kicker}</span>
          <h2 id="patterns-heading" className="type-h2 mt-4 text-center">
            {patterns.title}
          </h2>
          <p className="type-lead mx-auto mt-4 max-w-[54ch] text-center text-foreground-muted">
            {patterns.intro}
          </p>

          <div className="mt-10">
            {/* כותרות עמודות — דסקטופ בלבד */}
            <div className="hidden grid-cols-3 gap-4 border-b border-border-strong pb-3 sm:grid">
              {patterns.columns.map((c) => (
                <p
                  key={c}
                  className="text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover"
                >
                  {c}
                </p>
              ))}
            </div>
            <ul>
              {patterns.rows.map((r) => (
                <li
                  key={r.pattern}
                  className="border-b border-border py-5 sm:grid sm:grid-cols-3 sm:items-baseline sm:gap-4"
                >
                  <p className="font-serif text-[1.1rem] font-semibold text-foreground">
                    {r.pattern}
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-foreground-muted sm:mt-0">
                    <span className="font-semibold text-brand-hover sm:hidden">שורש: </span>
                    {r.root}
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-foreground sm:mt-0">
                    <span className="font-semibold text-brand-hover sm:hidden">הצורך: </span>
                    {r.need}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
