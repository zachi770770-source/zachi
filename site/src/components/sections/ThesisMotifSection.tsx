import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { StagedTextReveal } from "@/components/shared/StagedTextReveal";
import { PathMotif } from "@/components/sections/PathMotif";
import { bigIdea } from "@/content/book";

/**
 * סקשן התזה כמרכז החזותי של הנרטיב: הרעיון „חיפוש → בנייה” כבאנד מרווה
 * מלא-רוחב — הרגע הצבעוני-נועז היחיד בעמוד, שובר את רצף הבז' ומעגן את
 * הרעיון. מוטיב אחד (PathMotif) בקנה מידה גדול: נקודות מפוזרות שמתלכדות
 * למבנה יציב. הטקסט הוא bigIdea הקיים בלבד; המוטיב דקורטיבי (aria-hidden).
 *
 * פריסה: RTL — טקסט בצד המתחיל (ימין), המוטיב בצד השני (שמאל). במובייל
 * הטקסט למעלה והמוטיב מתחתיו. קריאה מבוקרת מילה-אחר-מילה (StagedTextReveal),
 * CSS-first ו-reduced-motion-safe: הטקסט המלא ב-SSR וגלוי כברירת מחדל.
 */
export function ThesisMotifSection() {
  return (
    <section
      id="thesis"
      className="relative scroll-mt-24 overflow-hidden bg-secondary py-20 text-secondary-foreground sm:py-28"
      aria-labelledby="thesis-heading"
    >
      {/* עומק עדין: הילה כהה רכה שמוסיפה תלת-ממד לבאנד, ללא צבע חדש */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
      >
        <div className="absolute -top-24 start-[-10%] h-[560px] w-[560px] rounded-full bg-[color:var(--color-ink)]/25 blur-[130px]" />
        <div className="absolute -bottom-32 end-[-6%] h-[520px] w-[520px] rounded-full bg-brand/[0.10] blur-[120px]" />
      </div>

      <Container className="relative">
        <Reveal className="mx-auto grid max-w-5xl items-center gap-x-16 gap-y-12 md:grid-cols-2">
          <StagedTextReveal
            className="text-start"
            groups={[
              {
                text: bigIdea.title,
                as: "h2",
                id: "thesis-heading",
                className:
                  "font-serif text-[2.4rem] font-semibold leading-[1.05] text-secondary-foreground sm:text-5xl lg:text-[3.4rem]",
              },
              {
                text: bigIdea.intro,
                as: "p",
                className:
                  "mt-6 max-w-[42ch] text-lg leading-relaxed text-secondary-foreground/85 sm:text-xl",
              },
            ]}
          />

          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 mx-auto my-auto h-40 w-[85%] rounded-full bg-secondary-foreground/[0.06] blur-[54px]"
            />
            <PathMotif tone="light" className="mx-auto max-w-[520px]" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
