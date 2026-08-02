import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { homeRelevance } from "@/content/relevance";

/**
 * „אולי אחד המקומות האלה מוכר לכם” — מקטע רלוונטיות/אמון אנושי אחד, תמציתי.
 *
 * מציג מצבים/ארכיטיפים של קוראים (לא המלצות, לא אנשים אמיתיים, לא סיפורי
 * הצלחה), ואז בקצרה את גישת הספר וסגירה. ללא כרטיסי המלצה, בועות צ׳אט,
 * מרכאות, אווטרים או כוכבים. שומר על שפת ה-Ink/Ivory/Sage/Terracotta,
 * סרוק במובייל, ומשתמש בחשיפת ה-Reveal הקיימת בלבד.
 */
export function HomeRelevance() {
  const { eyebrow, title, intro, situations, approach, closing } = homeRelevance;

  return (
    <section
      id="relevance"
      className="scroll-mt-20 py-16 sm:py-20 lg:py-24"
      aria-labelledby="relevance-heading"
    >
      <Container>
        {/* פתיח — זיהוי (למי הספר) */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">{eyebrow}</span>
          <h2 id="relevance-heading" className="type-h2 mt-4">
            {title}
          </h2>
          <p className="type-lead mt-4 text-foreground-muted">{intro}</p>
        </Reveal>

        {/* מצבים/ארכיטיפים — רשת עריכתית מרוסנת (לא כרטיסי המלצה) */}
        <Reveal className="mx-auto mt-10 grid max-w-4xl gap-x-10 gap-y-8 sm:mt-12 sm:grid-cols-2">
          {situations.map((s) => (
            <div key={s.title} className="border-s-2 border-brand/60 ps-5">
              <h3 className="font-serif text-[1.15rem] font-semibold leading-snug text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                {s.body}
              </p>
            </div>
          ))}
        </Reveal>

        {/* גישת הספר — נבדל בקו-שיער עדין ובמרווח, בלי באנד צבע נוסף */}
        <Reveal className="mx-auto mt-14 max-w-4xl border-t border-border pt-12 sm:mt-16 sm:pt-14">
          <div className="mx-auto max-w-2xl text-center">
            <span className="kicker justify-center">הגישה</span>
            <h3 className="mt-4 font-serif text-[clamp(1.5rem,2.8vw,2.05rem)] font-semibold leading-[1.15] text-balance text-foreground">
              {approach.title}
            </h3>
            <p className="mx-auto mt-4 max-w-[58ch] text-[16.5px] leading-relaxed text-foreground-muted">
              {approach.intro}
            </p>
          </div>

          <ul className="mx-auto mt-10 grid max-w-3xl gap-x-10 gap-y-7 sm:grid-cols-2">
            {approach.benefits.map((b, i) => (
              <li key={b.title} className="flex gap-3.5">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-muted font-quote text-[13px] font-bold text-brand-hover tabular-nums"
                >
                  {i + 1}
                </span>
                <div>
                  <h4 className="font-serif text-[1.08rem] font-semibold text-foreground">
                    {b.title}
                  </h4>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                    {b.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* סגירה — התזה, בלי מרכאות המלצה */}
        <Reveal className="mx-auto mt-14 max-w-2xl text-center sm:mt-16">
          <p className="font-quote text-[clamp(1.3rem,2.4vw,1.6rem)] font-semibold leading-snug text-brand-hover">
            {closing.thesis}
          </p>
          <p className="mt-3 text-[16px] leading-relaxed text-foreground-muted">
            {closing.line}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
