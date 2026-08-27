import Link from "next/link";

import { Container } from "@/components/shared/Container";
import { recognition } from "@/content/homeStory";

/**
 * הביט שמיד אחרי ה-Hero: לפני שמבקשים מהמבקר לבחור תחנה, נותנים לו רגע אחד של
 * „זה מדבר עליי” — ואז נותנים לספר לדבר בקולו שלו.
 *
 * הציטוט הוא טקסט אמיתי מתוך הספר (מילה במילה), ולא קופי שיווקי שנכתב עליו.
 * זה מה שהופך את הביט לאמין: המבקר פוגש את הכתיבה עצמה לפני שהוא מתבקש לקנות.
 *
 * המשכיות מה-Hero (PHASE NARRATIVE): המקטע אינו „מתחיל מחדש” עם fade-up. חוט-
 * ההמשכיות (`recog__thread`) ממשיך את `sig-hero__thread` — אותו קו-מותג באותו
 * מיקום — ומושך את הכותרת פנימה: ה-Hero *הופך לפרק הבא*, לא נגמר. הציטוט מקבל
 * רגע עריכתי — חשיפת-מסכה מכיוון הקריאה (RTL), כמו „דיו שנכתב” — במקום עוד
 * `.reveal`. הכול opacity/transform/clip-path (ללא CLS), מגודר ב-`.motion-js`,
 * ומתכבד תחת prefers-reduced-motion (מצב סופי מיידי; הבלוק הגלובלי מאפס משך).
 *
 * `.reveal` על המקטע מפעיל את הכוריאוגרפיה כשהוא נכנס לתצוגה (`.is-visible`);
 * ה-fade הכללי מנוטרל והילדים נושאים את התנועה (אותו דפוס כמו `thesis-scene`).
 */
export function RecognitionBeat() {
  return (
    <section
      aria-labelledby="recognition-heading"
      className="recog reveal relative py-10 sm:py-14"
    >
      {/* חוט-המשכיות: ממשיך את קו-ה-Hero מלמעלה אל תוך הכותרת — הרצף המרחבי
          שמחבר את שתי הסצנות. דקורטיבי בלבד. */}
      <span className="recog__thread" aria-hidden="true" />

      <Container>
        <div className="recog__intro mx-auto max-w-2xl text-center">
          <h2
            id="recognition-heading"
            className="recog__line font-serif text-[clamp(1.6rem,3.4vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.01em] text-foreground [text-wrap:balance]"
          >
            {recognition.line}
          </h2>
          <p className="recog__support mx-auto mt-4 max-w-[46ch] text-[clamp(1.02rem,1.4vw,1.15rem)] leading-relaxed text-foreground-muted [text-wrap:pretty]">
            {recognition.support}
          </p>
        </div>

        {/* קול הספר עצמו — ציטוט אמיתי, לא הבטחה עליו. הגבול נמשך (scaleY)
            והטקסט נחשף בחשיפת-מסכה מכיוון הקריאה: רגע עריכתי, לא fade. */}
        <figure className="recog__quote mx-auto mt-9 max-w-2xl border-s-2 border-s-brand ps-5 sm:mt-11 sm:ps-7">
          <blockquote className="recog__quote-text type-literary text-[clamp(1.15rem,2vw,1.5rem)] leading-[1.5] text-foreground [text-wrap:pretty]">
            {recognition.quote}
          </blockquote>
          <figcaption className="recog__quote-src mt-3 text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
            {recognition.quoteSource}
          </figcaption>
        </figure>

        {/* המסלול השקט אל עמוד-הסמכות „אהבה” — נשמר, בהקשר שבו הוא הגיוני
            (אחרי הרעיון), ולא כשורה יתומה בתחתית העמוד. */}
        <p className="recog__love mx-auto mt-8 max-w-2xl text-center text-[14px] leading-relaxed text-foreground-muted">
          {recognition.loveLinkPrompt}{" "}
          <Link
            href="/love"
            className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {recognition.loveLinkLabel}
          </Link>
        </p>
      </Container>
    </section>
  );
}
