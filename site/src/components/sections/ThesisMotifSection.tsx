import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { StagedTextReveal } from "@/components/shared/StagedTextReveal";
import { PathMotif } from "@/components/sections/PathMotif";
import { bigIdea } from "@/content/book";

/**
 * סקשן התזה כמרכז החזותי של הנרטיב (PHASE 14): הרעיון „חיפוש → בנייה”
 * מקבל ביטוי חזותי דרך מוטיב אחד (PathMotif) — נקודות מפוזרות שמתלכדות
 * למבנה יציב ומשותף. הטקסט הוא bigIdea הקיים בלבד; המוטיב דקורטיבי.
 *
 * פריסה: RTL — טקסט בצד המתחיל (ימין), המוטיב בצד השני (שמאל). במובייל
 * הטקסט למעלה והמוטיב מתחתיו. הכל CSS-first ו-reduced-motion-safe.
 */
export function ThesisMotifSection() {
  return (
    <section className="py-14 sm:py-16" aria-labelledby="thesis-heading">
      <Container>
        <Reveal className="mx-auto grid max-w-4xl items-center gap-x-12 gap-y-8 md:grid-cols-[1fr_minmax(0,1.05fr)]">
          {/* קריאה מבוקרת: הכותרת והפתיח נחשפים מילה-אחר-מילה, בציר זמן רציף
              אחד, פעם אחת בכניסה לתצוגה. הטקסט המלא קיים ב-SSR וגלוי כברירת
              מחדל (ללא JS / reduced-motion / ללא IO). */}
          <StagedTextReveal
            className="text-start"
            groups={[
              {
                text: bigIdea.title,
                as: "h2",
                id: "thesis-heading",
                className:
                  "font-serif text-[1.9rem] font-semibold leading-tight text-foreground sm:text-4xl",
              },
              {
                text: bigIdea.intro,
                as: "p",
                className: "type-lead mt-5 text-foreground-muted",
              },
            ]}
          />

          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 mx-auto my-auto h-24 w-3/4 rounded-full bg-secondary/[0.12] blur-[46px]"
            />
            <PathMotif className="mx-auto max-w-[420px]" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
