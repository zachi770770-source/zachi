import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { BrandMark } from "@/components/shared/BrandMark";
import { bigIdea } from "@/content/book";

/**
 * רגע השיא — סצנה עריכתית אחת אנכית: רעש החיפוש (מילים מפוזרות מהתוכן),
 * העצירה והתובנה ("דייטינג הוא חיפוש → אהבה היא בנייה"), ואז שלושה עקרונות
 * בנייה מסודרים. אין דיפטיך ואין כרטיסים. התנועה היא reveal חד-פעמי
 * (opacity/transform) שהופך לסטטי תחת prefers-reduced-motion.
 */

// מילות "רעש" קצרות — נלקחות מתוך התוכן הקיים (צד החיפוש) בלבד.
const NOISE = ["בוחנים", "משווים", "עוד התאמה", "מחפשים ודאות", "מה חסר?", "האם זה הוא?", "עוד דייט"];

export function ThesisSection() {
  const build = bigIdea.columns[1];
  const principles = build.items.slice(0, 3);

  return (
    <section
      id="thesis"
      className="relative scroll-mt-20 overflow-hidden bg-surface-muted"
      aria-labelledby="thesis-heading"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -bottom-32 start-[-8%] h-[560px] w-[560px] rounded-full bg-secondary/[0.10] blur-[130px]" />
      </div>

      <div className="py-24 sm:py-32">
        <Container>
          {/* חשיפה אחת לכל הסצנה המרכזית — רעש החיפוש, העצירה והתובנה,
              וההבטחה — במקום ארבע חשיפות נפרדות. */}
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <BrandMark className="mx-auto h-9 w-9 text-foreground/80" />
            <span className="kicker mt-5 justify-center">הרעיון המרכזי</span>

            {/* רעש החיפוש: מילים מפוזרות ומעומעמות */}
            <div className="mt-10 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {NOISE.map((w, i) => (
                <span
                  key={w}
                  className="text-foreground-muted"
                  style={{
                    fontSize: `${15 + (i % 3) * 4}px`,
                    transform: `translateY(${(i % 2 === 0 ? -1 : 1) * (4 + (i % 3) * 3)}px)`,
                  }}
                >
                  {w}
                </span>
              ))}
            </div>

            {/* העצירה והתובנה */}
            <p className="type-literary mt-12 text-[clamp(1.75rem,3vw,2.5rem)] font-medium text-foreground/70">
              דייטינג הוא חיפוש.
            </p>
            {/* קו הבנייה — אנכי, מחבר בין החיפוש לבנייה */}
            <span
              aria-hidden="true"
              className="mx-auto my-6 block h-14 w-px bg-gradient-to-b from-foreground/20 to-brand"
            />
            <h2 id="thesis-heading" className="type-h2 text-brand-hover">
              אהבה היא בנייה.
            </h2>

            <p className="mt-8 max-w-[54ch] text-[clamp(1.05rem,1.4vw,1.28rem)] leading-relaxed text-foreground-muted">
              {bigIdea.promise}
            </p>
            {/* קישור-הקשר אל עמוד-הסמכות „אהבה” — הרחבה מושגית של התזה. */}
            <Link
              href="/love"
              className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              מהי אהבה ואיך היא נבנית
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>

          {/* שלושה עקרונות בנייה + הסתייגות — חשיפה מקובצת אחת */}
          <Reveal className="mx-auto mt-16 max-w-4xl border-t border-foreground/15 pt-12">
            <div className="grid gap-x-12 gap-y-8 sm:grid-cols-3">
              {principles.map((item, i) => (
                <div key={item} className="flex flex-col gap-3">
                  <span className="type-quote text-3xl font-bold text-brand tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[18px] leading-relaxed text-foreground">{item}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-12 max-w-2xl text-center text-[15px] leading-relaxed text-foreground-muted">
              {bigIdea.caveat}
            </p>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}
