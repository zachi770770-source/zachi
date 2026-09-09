import { ArrowLeft } from "lucide-react";

import { sampleReader, sampleCtaLabel } from "@/content/sample";
import { Container } from "@/components/shared/Container";
import { BookLink } from "@/components/shared/BookLink";

/**
 * „קראו טעימה” — הצעד הרביעי בעמוד השדרה (הבנה → זיהוי → מה הספר נותן →
 * **טעימה** → רכישה).
 *
 * **גשר, לא סצנה.** הגרסה הראשונה שלו נמדדה ב-502px: קיקר, כותרת-h2, ציטוט
 * בן שתי פסקאות, כפתור והערה — כלומר מקטע-מלא שהחליף בר צף בן 64px והאריך
 * את העמוד במקום לקצר אותו. עכשיו זו שורה אחת מהספר וקישור: משפט-העיקרון
 * המאושר, שהוא ממילא המשפט שהמבקר בא לבדוק, ומיד הפעולה. אין כותרת-מקטע —
 * גשר אינו צריך כותרת, הוא צריך להעביר.
 *
 * התוכן אינו חדש: `sampleReader.principle.emphasis`, אותו משפט שמופיע בטעימה.
 */
export function SampleBridge() {
  return (
    <section
      id="sample-bridge"
      className="sample-bridge scroll-mt-20 py-8 sm:py-10"
      aria-label="טעימה מהספר"
    >
      <Container>
        <div className="sample-bridge__inner">
          <p className="sample-bridge__line">{sampleReader.principle.emphasis}</p>
          <BookLink href="/preview" className="sample-bridge__cta">
            {sampleCtaLabel()}
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </BookLink>
        </div>
      </Container>
    </section>
  );
}
