import Link from "next/link";

import { Container } from "@/components/shared/Container";
import { recognition } from "@/content/homeStory";

/**
 * הביט שהיה חסר מיד אחרי ה-Hero: לפני שמבקשים מהמבקר לבחור תחנה, נותנים לו
 * רגע אחד של „זה מדבר עליי” — ואז נותנים לספר לדבר בקולו שלו.
 *
 * הציטוט הוא טקסט אמיתי מתוך הספר (מילה במילה), ולא קופי שיווקי שנכתב עליו.
 * זה מה שהופך את הביט לאמין: המבקר פוגש את הכתיבה עצמה לפני שהוא מתבקש לקנות.
 *
 * בלי קיקר בכוונה — ראו את ההערה ב-`recognition`. המקטע ממשיך את ה-Hero במקום
 * להכריז על עצמו, ומקטע-התחנות שאחריו הוא זה שנושא את „רגע של זיהוי”.
 */
export function RecognitionBeat() {
  return (
    <section aria-labelledby="recognition-heading" className="py-8 sm:py-14">
      <Container>
        <div className="reveal mx-auto max-w-2xl text-center">
          <h2
            id="recognition-heading"
            className="font-serif text-[clamp(1.6rem,3.4vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.01em] text-foreground [text-wrap:balance]"
          >
            {recognition.line}
          </h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-[clamp(1.02rem,1.4vw,1.15rem)] leading-relaxed text-foreground-muted [text-wrap:pretty]">
            {recognition.support}
          </p>
        </div>

        {/* קול הספר עצמו — ציטוט אמיתי, לא הבטחה עליו. */}
        <figure className="reveal mx-auto mt-8 max-w-2xl border-s-2 border-s-brand ps-5 sm:mt-10 sm:ps-7">
          <blockquote className="type-literary text-[clamp(1.15rem,2vw,1.5rem)] leading-[1.5] text-foreground [text-wrap:pretty]">
            {recognition.quote}
          </blockquote>
          <figcaption className="mt-3 text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
            {recognition.quoteSource}
          </figcaption>
        </figure>

        {/* המסלול השקט אל עמוד-הסמכות „אהבה” — נשמר, אך עכשיו הוא יושב בהקשר
            שבו הוא הגיוני (אחרי הרעיון), ולא כשורה יתומה בתחתית העמוד. */}
        <p className="reveal mx-auto mt-7 max-w-2xl text-center text-[14px] leading-relaxed text-foreground-muted">
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
