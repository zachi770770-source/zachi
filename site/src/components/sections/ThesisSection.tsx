import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { BrandMark } from "@/components/shared/BrandMark";
import { bigIdea } from "@/content/book";

/**
 * הרגע הקולנועי של העמוד: משפט התזה על פחם עמוק, ומתחתיו ההשוואה בין
 * "חיפוש" ל"בנייה" — צד החיפוש מאופק, צד הבנייה מואר בטרקוטה.
 */
export function ThesisSection() {
  const [search, build] = bigIdea.columns;

  return (
    <section
      id="thesis"
      className="relative scroll-mt-20 bg-ink text-background"
      aria-labelledby="thesis-heading"
    >
      {/* מעבר רך מהרקע הבהיר אל הפחם */}
      <div
        aria-hidden="true"
        className="h-20 w-full bg-gradient-to-b from-background to-ink sm:h-28"
      />
      <div className="grain-layer absolute inset-0 opacity-[0.05] mix-blend-soft-light" aria-hidden="true" />

      <div className="relative pb-24 pt-6 sm:pb-32 sm:pt-10">
        <Container>
          <Reveal className="mx-auto max-w-3xl text-center">
            <BrandMark className="mx-auto h-10 w-10 text-background/80" />
            <span className="mt-5 block text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-foreground/70">
              הרעיון המרכזי
            </span>
            <h2
              id="thesis-heading"
              className="type-quote mt-6 text-[clamp(2.75rem,6vw,5rem)] font-bold leading-[1.05] text-background"
            >
              דייטינג הוא חיפוש.
              <br />
              <span className="text-[color:#e0885d]">אהבה היא בנייה.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-[54ch] text-[clamp(1.05rem,1.4vw,1.28rem)] leading-relaxed text-background/70">
              {bigIdea.clarification}
            </p>
          </Reveal>

          {/* השוואה: חיפוש (מאופק) מול בנייה (מואר) */}
          <Reveal className="mx-auto mt-16 grid max-w-4xl overflow-hidden rounded-3xl border border-white/10 sm:mt-20 sm:grid-cols-2">
            {[search, build].map((col, i) => {
              const isBuild = i === 1;
              return (
                <div
                  key={col.title}
                  className={
                    "relative flex flex-col gap-5 p-9 sm:p-11 " +
                    (isBuild
                      ? "bg-[linear-gradient(160deg,rgba(166,92,62,0.22),rgba(166,92,62,0.05))]"
                      : "bg-white/[0.02]")
                  }
                >
                  {/* קו מפריד בין העמודות */}
                  {isBuild ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-8 top-0 h-px bg-white/10 sm:inset-x-auto sm:inset-y-9 sm:start-0 sm:h-auto sm:w-px"
                    />
                  ) : null}

                  <div className="flex items-center gap-3">
                    <span
                      className={
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] " +
                        (isBuild
                          ? "bg-brand text-brand-foreground"
                          : "bg-white/10 text-background/70")
                      }
                    >
                      {isBuild ? "בנייה" : "חיפוש"}
                    </span>
                    <h3 className="type-quote text-2xl font-semibold text-background">
                      {col.title}
                    </h3>
                  </div>

                  <ul className="flex flex-col gap-3.5">
                    {col.items.map((item) => (
                      <li
                        key={item}
                        className={
                          "flex items-baseline gap-3 text-[17px] leading-relaxed " +
                          (isBuild ? "text-background/95" : "text-background/65")
                        }
                      >
                        <span
                          aria-hidden="true"
                          className={
                            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full " +
                            (isBuild ? "bg-brand" : "bg-white/30")
                          }
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </Reveal>

          <Reveal className="mx-auto mt-10 max-w-2xl text-center">
            <p className="text-[15px] leading-relaxed text-background/55">
              {bigIdea.caveat}
            </p>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}
