import { ArrowLeft, ArrowDown } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { BrandMark } from "@/components/shared/BrandMark";
import { bigIdea } from "@/content/book";

/**
 * "מחיפוש לבנייה" כפריסה עריכתית: דיפטיך המחולק בקו שיער מרכזי, לא בכרטיסים.
 * צד החיפוש מאופק (טקסט וסימנים דהויים), צד הבנייה חם (טרקוטה) — הניגוד
 * הטיפוגרפי עצמו מספר את המעבר, על רקע שמנת חמה.
 */
type ThesisColumnData = (typeof bigIdea.columns)[number];

function ThesisColumn({
  col,
  isBuild,
}: {
  col: ThesisColumnData;
  isBuild: boolean;
}) {
  return (
    <div className={isBuild ? "sm:ps-14" : "sm:pe-14"}>
      <div className="flex items-baseline gap-3">
        <span
          className={
            "text-[12px] font-semibold uppercase tracking-[0.18em] " +
            (isBuild ? "text-brand-hover" : "text-foreground-muted")
          }
        >
          {isBuild ? "בנייה" : "חיפוש"}
        </span>
        <span className="h-px flex-1 bg-foreground/12" aria-hidden="true" />
      </div>
      <h3
        className={
          "type-quote mt-4 text-[26px] font-semibold " +
          (isBuild ? "text-foreground" : "text-foreground/80")
        }
      >
        {col.title}
      </h3>
      <ul className="mt-6 flex flex-col divide-y divide-foreground/10">
        {col.items.map((item) => (
          <li
            key={item}
            className={
              "flex items-baseline gap-3 py-3 text-[17px] leading-relaxed " +
              (isBuild ? "text-foreground" : "text-foreground-muted")
            }
          >
            <span
              aria-hidden="true"
              className={
                "mt-2 h-1.5 w-1.5 shrink-0 rounded-full " +
                (isBuild ? "bg-brand" : "bg-foreground/25")
              }
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ThesisSection() {
  const [search, build] = bigIdea.columns;

  return (
    <section
      id="thesis"
      className="relative scroll-mt-20 overflow-hidden bg-surface-muted"
      aria-labelledby="thesis-heading"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -bottom-32 start-[-8%] h-[620px] w-[620px] rounded-full bg-brand/[0.10] blur-[130px]" />
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

          {/* דיפטיך: חיפוש | בנייה, מופרד בקו שיער מרכזי */}
          <Reveal className="relative mx-auto mt-16 max-w-4xl border-y border-foreground/15 sm:mt-20">
            <div className="grid gap-y-10 py-10 sm:grid-cols-2 sm:gap-y-0 sm:py-14">
              <ThesisColumn col={search} isBuild={false} />
              <ThesisColumn col={build} isBuild={true} />
            </div>

            {/* קו שיער אנכי + חץ מעבר (דסקטופ) */}
            <span
              aria-hidden="true"
              className="absolute inset-y-10 start-1/2 hidden w-px -translate-x-1/2 bg-foreground/15 sm:block"
            />
            <span
              aria-hidden="true"
              className="absolute start-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 bg-surface-muted px-2 text-brand sm:block"
            >
              <ArrowLeft className="h-6 w-6" />
            </span>

            {/* מפריד + חץ (מובייל) */}
            <span
              aria-hidden="true"
              className="absolute inset-x-8 top-1/2 -translate-y-1/2 border-t border-foreground/15 sm:hidden"
            />
            <span
              aria-hidden="true"
              className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-muted px-2 py-1 text-brand sm:hidden"
            >
              <ArrowDown className="h-5 w-5" />
            </span>
          </Reveal>

          <Reveal className="mx-auto mt-10 max-w-2xl text-center">
            <p className="text-[15px] leading-relaxed text-foreground-muted">
              {bigIdea.caveat}
            </p>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}
