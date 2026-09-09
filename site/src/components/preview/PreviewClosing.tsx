import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { previewClosing } from "@/content/sample";
import { readerKitOffer } from "@/content/readerKit";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { BookLink } from "@/components/shared/BookLink";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";

/**
 * סיום עמוד-הטעימה — הרגע החם ביותר באתר, ולכן גם המסודר ביותר.
 *
 * הסדר כאן אינו סגנוני; הוא הכלל. מי שסיים לקרוא קטע מהספר נמצא בשיא הנכונות,
 * וכל דבר שממוקם *אחרי* הרכישה מוריד ממנה. קודם ישבו כאן, מתחת לכפתור-הרכישה,
 * קישור ל-/book וקישור לשאלון — כלומר שתי הזמנות לצאת מהמסלול בדיוק בנקודה
 * שבה הוא נסגר. הכלל החדש:
 *
 *   1. שורת-הסיום של הטעימה
 *   2. ערכת-הקורא — תועלת תומכת, לא פעולה
 *   3. „מה עוד מחכה בספר” — יציאה שלישונית ל-/book
 *   4. **בלוק הרכישה — הפעולה האחרונה בעמוד**
 *   5. פוטר
 *
 * אחרי אמזון אין שום דבר לחיץ: לא כלי, לא שאלון, לא בר צף. הקישור לשאלון
 * („בדקו מה הספר אומר”) הוסר מכאן לגמרי — הוא החזיר את הקורא הכי-חם אחורה,
 * אל תחילת המשפך.
 */
export function PreviewClosing() {
  return (
    <section
      id="join"
      className="scroll-mt-20 bg-surface-muted py-16 sm:py-20"
      aria-labelledby="preview-closing-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface px-6 py-10 sm:px-10 sm:py-12">
          {/* 1 — שורת-הסיום */}
          <div className="text-center">
            <span className="kicker justify-center">{previewClosing.eyebrow}</span>
            <h2 id="preview-closing-heading" className="type-h2 mt-4">
              {previewClosing.title}
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-[17px] leading-relaxed text-foreground-muted">
              {previewClosing.connect}
            </p>
            <p className="mx-auto mt-3 text-[14px] italic text-foreground-muted">
              לא כל ספק הוא סימן לעצור.
            </p>
          </div>

          {/* 2 — תועלת תומכת, וכן 3 — יציאה שלישונית. שתיהן קישורי-טקסט שקטים,
              ושתיהן *לפני* הרכישה, לא אחריה. */}
          <div className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-6 text-center">
            <p className="text-[14px] text-foreground-muted [text-wrap:pretty]">
              {readerKitOffer.ctaSubline}{" "}
              <Link
                href="/reader"
                className="font-medium text-brand-hover underline underline-offset-2 hover:text-foreground"
              >
                מה כלול בערכת הקורא
              </Link>
            </p>
            <BookLink
              href="/book"
              className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              מה עוד מחכה בספר
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                aria-hidden="true"
              />
            </BookLink>
          </div>

          {/* 4 — הפעולה האחרונה בעמוד. אין אחריה דבר. */}
          <div className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-8">
            <p className="text-[17px] font-semibold text-foreground [text-wrap:pretty]">
              רוצים להמשיך לקרוא? הספר זמין עכשיו באמזון.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <AmazonBuyLink source="preview">
                לרכישת הספר באמזון
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </AmazonBuyLink>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
