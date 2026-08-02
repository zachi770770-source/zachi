import { SearchToBuildScene } from "@/components/motion/SearchToBuildScene";

/**
 * סקשן התזה כמרכז החזותי של הנרטיב: הרעיון „חיפוש → בנייה” כבאנד מרווה
 * מלא-רוחב — הרגע החתימתי של העמוד. מ-PHASE MOTION 3 זהו סצנת scrollytelling
 * (SearchToBuildScene): שברים מפוזרים מתלכדים למבנה, „דייטינג הוא חיפוש” נמוג,
 * „אהבה היא בנייה” נבנית, וקו הטרקוטה ממשיך אל התחנות.
 *
 * הטקסט הוא bigIdea הקיים בלבד; המוטיב דקורטיבי (aria-hidden). בטוח-נפילה:
 * ללא JS/GSAP/תמיכה או תחת prefers-reduced-motion — מוצג ההרכב הסופי הקריא.
 */
export function ThesisMotifSection() {
  return (
    <section
      className="relative overflow-hidden bg-secondary py-20 text-secondary-foreground sm:py-28"
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

      <SearchToBuildScene />
    </section>
  );
}
