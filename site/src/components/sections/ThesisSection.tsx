import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { BrandMark } from "@/components/shared/BrandMark";
import { bigIdea } from "@/content/book";

/**
 * רגע השיא — סצנה עריכתית אחת אנכית: רעש החיפוש (מילים מפוזרות מהתוכן),
 * העצירה והתובנה ("דייטינג הוא חיפוש → אהבה היא בנייה"), ואז שלושה עקרונות
 * בנייה מסודרים. אין דיפטיך ואין כרטיסים.
 *
 * ה-motion (PHASE WOW) הופך את התזה מ-reveal סטטי ל*מעבר מובן ויזואלית*
 * מחיפוש לבנייה: רעש-החיפוש נכנס מפוזר ואז נרגע ומתעמעם, ציר אנכי *נמשך*
 * מלמעלה למטה כציר-הבנייה, כותרת-הבנייה עולה עם קו-חתימה שנמשך תחתיה, ושלושת
 * העקרונות „נבנים” בזה-אחר-זה כמבנה. הכול opacity/transform בלבד (ללא CLS),
 * מגודר ב-`.motion-js`, ומתכבד תחת prefers-reduced-motion (מצב סופי מיידי).
 * התנועה מונעת דרך `.reveal → .is-visible` (MotionRoot) — אין JS ייעודי.
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
              וההבטחה — במקום ארבע חשיפות נפרדות. `thesis-scene` נושא את
              כוריאוגרפיית ה-search→build (ראו globals.css). */}
          <Reveal className="thesis-scene mx-auto flex max-w-3xl flex-col items-center text-center">
            <BrandMark className="mx-auto h-9 w-9 text-foreground/80" />
            <span className="kicker mt-5 justify-center">הרעיון המרכזי</span>

            {/* רעש החיפוש: מילים מפוזרות ומעומעמות — נכנסות מפוזר ואז נרגעות. */}
            <div className="thesis-noise mt-10 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {NOISE.map((w, i) => (
                <span
                  key={w}
                  className="thesis-noise__word text-foreground-muted"
                  style={{
                    fontSize: `${15 + (i % 3) * 4}px`,
                    // מיקום-מנוחה (הפיזור הסופי) נשמר כפי שהיה; משתני ה-scatter
                    // הם נקודת-ההתחלה (מפוזר יותר) שממנה המילים נרגעות.
                    ["--rest-y" as string]: `${(i % 2 === 0 ? -1 : 1) * (4 + (i % 3) * 3)}px`,
                    ["--scatter-x" as string]: `${(i % 2 === 0 ? -1 : 1) * (10 + (i % 4) * 7)}px`,
                    ["--scatter-y" as string]: `${(i % 3 === 0 ? -1 : 1) * (10 + (i % 3) * 6)}px`,
                    ["--i" as string]: String(i),
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
            {/* ציר-הבנייה — אנכי, נמשך מלמעלה למטה, מחבר בין החיפוש לבנייה. */}
            <span
              aria-hidden="true"
              className="thesis-axis mx-auto my-6 block h-14 w-px bg-gradient-to-b from-foreground/20 to-brand"
            />
            <h2 id="thesis-heading" className="thesis-build type-h2 text-brand-hover">
              אהבה היא בנייה.
              <span className="thesis-build__stroke" aria-hidden="true" />
            </h2>

            <p className="thesis-promise mt-8 max-w-[54ch] text-[clamp(1.05rem,1.4vw,1.28rem)] leading-relaxed text-foreground-muted">
              {bigIdea.promise}
            </p>
            {/* קישור-הקשר אל עמוד-הסמכות „אהבה” — הרחבה מושגית של התזה. */}
            <Link
              href="/love"
              className="thesis-promise mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              מהי אהבה ואיך היא נבנית
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>

          {/* שלושה עקרונות בנייה + הסתייגות — „נבנים” בזה-אחר-זה כמבנה. */}
          <Reveal className="thesis-structure mx-auto mt-16 max-w-4xl border-t border-foreground/15 pt-12">
            <div className="grid gap-x-12 gap-y-8 sm:grid-cols-3">
              {principles.map((item, i) => (
                <div
                  key={item}
                  className="thesis-principle flex flex-col gap-3"
                  style={{ ["--i" as string]: String(i) }}
                >
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
