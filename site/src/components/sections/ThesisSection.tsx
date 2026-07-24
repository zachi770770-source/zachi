import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { bigIdea } from "@/content/book";

/**
 * רגע העריכה המרכזי של העמוד: משפט התזה על רקע כהה,
 * ומתחתיו הניגוד בין "חיפוש" ל"בנייה".
 */
export function ThesisSection() {
  const [search, build] = bigIdea.columns;

  return (
    <section
      id="thesis"
      className="relative scroll-mt-20 bg-foreground text-background"
      aria-labelledby="thesis-heading"
    >
      {/* מעבר רך מהרקע הבהיר של ה-Hero אל אזור הפחם */}
      <div
        aria-hidden="true"
        className="h-16 w-full bg-gradient-to-b from-background to-foreground sm:h-24"
      />

      <div className="texture-dots pb-24 pt-8 sm:pb-32 sm:pt-12">
      <Container>
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="mx-auto mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-brand/40 bg-brand/[0.12]">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
          </span>
          <span className="text-[13px] font-semibold uppercase tracking-[0.16em] text-brand-foreground/70">
            הרעיון המרכזי
          </span>
          <h2
            id="thesis-heading"
            className="type-quote mt-5 text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.08] text-background"
          >
            דייטינג הוא חיפוש.
            <br />
            אהבה היא בנייה.
          </h2>
          <p className="mx-auto mt-7 max-w-[52ch] text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-background/75">
            {bigIdea.clarification}
          </p>
        </Reveal>

        <Reveal className="mx-auto mt-16 grid max-w-4xl gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
          {[search, build].map((col, i) => {
            const isBuild = i === 1;
            return (
              <div
                key={col.title}
                className={
                  "flex flex-col gap-4 p-8 sm:p-10 " +
                  (isBuild ? "bg-brand/[0.14]" : "bg-foreground")
                }
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] " +
                      (isBuild
                        ? "bg-brand text-brand-foreground"
                        : "bg-white/10 text-background/70")
                    }
                  >
                    {isBuild ? "בנייה" : "חיפוש"}
                  </span>
                  <h3 className="text-xl font-bold text-background">{col.title}</h3>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {col.items.map((item) => (
                    <li
                      key={item}
                      className={
                        "text-[17px] leading-relaxed " +
                        (isBuild ? "text-background/95" : "text-background/70")
                      }
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </Reveal>
      </Container>
      </div>
    </section>
  );
}
