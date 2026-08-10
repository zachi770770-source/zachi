import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { previewClosing } from "@/content/sample";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { BookLink } from "@/components/shared/BookLink";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { AskBookLink } from "@/components/journey/AskBookLink";
import type { AskStationId } from "@/content/askRoute";

/**
 * אזור סיום לעמוד ההצצה: מחבר את הטעימה לספר המלא, עם פעולה ראשית אחת בלבד
 * (הצטרפות לרשימת ההמתנה בטרום-השקה, או רכישה כשהמכירה פתוחה), הסבר קצר מה
 * מקבלים, וקישור משני ל-/book. אין באזור יותר מפעולה ראשית אחת.
 *
 * `station` (כשהקורא הגיע מעמוד-מסלול דרך `?station=`) נישא הלאה לעוזר, כדי
 * שלא ישאל שוב „איפה אתם?”.
 */
export function PreviewClosing({ station }: { station?: AskStationId }) {
  return (
    <section
      id="join"
      className="scroll-mt-20 bg-surface-muted py-16 sm:py-20"
      aria-labelledby="preview-closing-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface px-6 py-10 sm:px-10 sm:py-12">
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

          {/* מי שסיים את הטעימה הוא הקורא החם ביותר — פעולה ראשית אחת וברורה:
              רכישה עכשיו באמזון. */}
          <div className="mt-8 flex flex-col items-center gap-3">
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

          <div className="mt-8 flex flex-col items-center gap-4 border-t border-border pt-6 text-center">
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
            {/* מעבר ברור לעוזר — לקורא שסיים את הטעימה ולא בטוח מאיפה להתחיל.
                נושא את ה-station אם הגיע מעמוד-מסלול, כדי לא לשאול שוב „איפה אתם?”. */}
            <AskBookLink
              station={station}
              prompt={previewClosing.compassLinkLabel}
              className="text-center"
            />
            {/* שקט ולא-חוסם: עדכון על המהדורה הישירה/מודפסת העתידית באתר. */}
            <Link
              href="/waitlist"
              className="text-[13px] text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              רוצים עדכון כשהמהדורה הישירה באתר תיפתח?
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
