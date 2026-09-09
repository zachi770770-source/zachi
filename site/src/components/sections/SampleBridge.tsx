import { ArrowLeft } from "lucide-react";

import { sampleReader } from "@/content/sample";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { BookLink } from "@/components/shared/BookLink";

/**
 * „קראו טעימה” — הצעד הרביעי בעמוד השדרה (הבנה → זיהוי → מה הספר נותן →
 * **טעימה** → רכישה), כמקטע אמיתי בזרימת העמוד.
 *
 * המקטע הזה מחליף את `StickyCta` — בר-טעימה צף שליווה את עמוד הבית. הבר עשה
 * עבודה נכונה במקום שגוי: במובייל הוא ישב, יחד עם בועת-המצפן, מעל ה-CTA הסוגר
 * והסתיר את „עוד לא בטוחים? קראו טעימה מהספר”, כלומר התחרה בדיוק במה שהוא בא
 * לשרת. אותה הזמנה, עכשיו במקום שבו היא נכונה בזרימה, ובלי לכסות דבר.
 *
 * התוכן אינו חדש: זו פתיחת-הטעימה המאושרת (`sampleReader.opening`) ומשפט
 * העיקרון שלה. המבקר קורא שתי שורות אמיתיות מהספר לפני שהוא מחליט אם ללחוץ.
 */
export function SampleBridge() {
  return (
    <section
      id="sample-bridge"
      className="sample-bridge scroll-mt-20 py-12 sm:py-16"
      aria-labelledby="sample-bridge-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">טעימה</span>
          <h2 id="sample-bridge-heading" className="type-h2 mt-2">
            כך זה נשמע מבפנים.
          </h2>
          <blockquote className="sample-bridge__quote mt-6 text-start">
            <p className="text-[17px] leading-relaxed text-foreground-muted [text-wrap:pretty] sm:text-[18px]">
              {sampleReader.opening}
            </p>
            <p className="mt-4 font-serif text-[19px] font-semibold leading-snug text-foreground sm:text-[21px]">
              {sampleReader.principle.emphasis}
            </p>
          </blockquote>
          <div className="mt-8 flex flex-col items-center gap-2">
            <Button asChild size="lg">
              <BookLink href="/preview">
                {sampleReader.title}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </BookLink>
            </Button>
            <p className="text-[13.5px] text-foreground-muted">בלי הרשמה.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
