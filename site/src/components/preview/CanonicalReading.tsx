import { cn } from "@/lib/utils";
import { canonicalExcerpt } from "@/content/sample";
import { Container } from "@/components/shared/Container";

/**
 * חוויית קריאה קנונית ורציפה מתוך הספר — קטע מאושר של המחבר (מבוא: „החלק השני
 * של האהבה”, גרסה 888), מוצג מילה-במילה ובזרימה אחת. זו התשובה הברורה לשאלה
 * „איך הספר עצמו מרגיש כשקוראים אותו?”.
 *
 * מכוון: טיפוגרפיית ספר (serif, רוחב-שורה נוח, מרווח נדיב), בלי כרטיסים, בלי
 * כלים, ובלי שום CTA שיווקי בתוך הקריאה. המשך-הרכישה מגיע *אחרי* הקטע (PreviewClosing).
 * שרת-בלבד: אין state ואין JS — התוכן גלוי במלואו מיד (אין read-more/קיפול).
 */
export function CanonicalReading() {
  const { eyebrow, title, source, readingTime, paragraphs } = canonicalExcerpt;

  return (
    <section
      aria-labelledby="canonical-reading-heading"
      className="border-t border-border bg-surface-muted/30"
    >
      <Container className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[44rem]">
          <header className="text-center">
            <span className="kicker justify-center">{eyebrow}</span>
            <h2
              id="canonical-reading-heading"
              className="mt-4 font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[1.15] text-foreground [text-wrap:balance]"
            >
              {title}
            </h2>
            <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-muted">
              {source} · {readingTime}
            </p>
          </header>

          {/* גוף הקטע — פסקאות רצופות, ורבטים. פסקה ראשונה מעט גדולה יותר ככניסה
              רכה, ללא drop-cap דקורטיבי שיפריע לקריאה בעברית. */}
          <div className="mt-10 flex flex-col gap-6 sm:mt-12">
            {paragraphs.map((para, i) => (
              <p
                key={i}
                className={cn(
                  "font-serif text-[clamp(1.075rem,1.35vw,1.2rem)] leading-[1.9] text-foreground/90 [text-wrap:pretty]",
                  i === 0 &&
                    "text-[clamp(1.15rem,1.5vw,1.3rem)] leading-[1.85] text-foreground",
                )}
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
