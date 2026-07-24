import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { BrandMark } from "@/components/shared/BrandMark";
import { SearchToBuild } from "@/components/shared/SearchToBuild";
import { bigIdea } from "@/content/book";

/**
 * הרעיון המרכזי, מסופר כמעבר: מ"חיפוש" מבלבל (כרטיס פחם-אספרסו חם, מינון
 * מצומצם) אל "בנייה" חמה ומוארת (טרקוטה ושמנת). הקומפוזיציה עצמה מספרת את
 * המסע — בלי משטח שחור דומיננטי.
 */
export function ThesisSection() {
  const [search, build] = bigIdea.columns;

  return (
    <section
      id="thesis"
      className="relative scroll-mt-20 overflow-hidden bg-surface-muted"
      aria-labelledby="thesis-heading"
    >
      {/* זוהר טרקוטה חם בצד ה"בנייה" (שמאל ב-RTL) — אור ותקווה */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -bottom-24 start-[-6%] h-[560px] w-[560px] rounded-full bg-brand/[0.10] blur-[120px]" />
        <div className="grain-layer absolute inset-0 opacity-[0.03] mix-blend-multiply" />
      </div>

      <div className="py-24 sm:py-32">
        <Container>
          <Reveal className="mx-auto max-w-3xl text-center">
            <BrandMark className="mx-auto h-10 w-10 text-foreground/85" />
            <span className="kicker mt-5 justify-center">הרעיון המרכזי</span>
            <h2
              id="thesis-heading"
              className="type-quote mt-5 text-[clamp(2.75rem,6vw,5rem)] font-bold leading-[1.05] text-foreground"
            >
              דייטינג הוא חיפוש.
              <br />
              <span className="text-brand-hover">אהבה היא בנייה.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-[54ch] text-[clamp(1.05rem,1.4vw,1.28rem)] leading-relaxed text-foreground-muted">
              {bigIdea.clarification}
            </p>
          </Reveal>

          {/* המעבר עצמו: חיפוש (פחם חם, מאופק) → בנייה (טרקוטה ושמנת, מואר) */}
          <Reveal className="relative mx-auto mt-16 grid max-w-4xl items-stretch gap-5 sm:mt-20 sm:grid-cols-2 sm:gap-6">
            {/* חיפוש — מינון מצומצם של פחם חם */}
            <div className="relative flex flex-col gap-5 rounded-3xl bg-ink p-9 text-background/90 sm:p-10">
              <div className="grain-layer absolute inset-0 rounded-3xl opacity-[0.06] mix-blend-soft-light" aria-hidden="true" />
              <div className="relative flex items-center gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-background/70">
                  חיפוש
                </span>
                <h3 className="type-quote text-2xl font-semibold text-background">
                  {search.title}
                </h3>
              </div>
              <ul className="relative flex flex-col gap-3.5">
                {search.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-3 text-[17px] leading-relaxed text-background/70"
                  >
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* חץ מעבר — מחיפוש לבנייה (שמאלה ב-RTL) */}
            <span
              aria-hidden="true"
              className="absolute start-1/2 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-brand/30 bg-surface text-brand shadow-[0_10px_24px_-12px_rgba(166,92,62,0.5)] sm:flex"
            >
              <ArrowLeft className="h-5 w-5" />
            </span>

            {/* בנייה — טרקוטה ושמנת, מוארת וחמה */}
            <div className="relative flex flex-col gap-5 rounded-3xl border border-brand/25 bg-[linear-gradient(150deg,var(--color-brand-muted),var(--color-surface))] p-9 shadow-[0_30px_70px_-45px_rgba(166,92,62,0.55)] sm:p-10">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-foreground">
                  בנייה
                </span>
                <h3 className="type-quote text-2xl font-semibold text-foreground">
                  {build.title}
                </h3>
              </div>
              <ul className="flex flex-col gap-3.5">
                {build.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-3 text-[17px] leading-relaxed text-foreground"
                  >
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-5 text-center">
            <SearchToBuild className="h-9 w-[240px] max-w-full text-foreground/60" />
            <p className="text-[15px] leading-relaxed text-foreground-muted">
              {bigIdea.caveat}
            </p>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}
