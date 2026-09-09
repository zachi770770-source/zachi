import { Container } from "@/components/shared/Container";
import { homePathUi } from "@/content/homePaths";
import { HomePathEntry } from "@/components/sections/HomePathEntry";

/**
 * „איפה אתם נמצאים עכשיו?” — **שכבת הניווט** של עמוד הבית, לא ליבו.
 *
 * המקטע ירד במעמדו במכוון. קודם הוא היה „רגע-ההקשבה” של העמוד ועמד לפני
 * האמון (המחבר) ולפני הטיעון (למה ספר) — כלומר המבקר התבקש לעבוד לפני שקיבל
 * סיבה. עכשיו הוא יושב *אחרי* שני אלה: קודם הספר מסביר את עצמו, ורק אז
 * מוצעות נקודות-הכניסה האישיות.
 *
 * הוא גם אינו „אי-לקוח” יותר: אין שיחה, אין Focus Mode, אין תיבת-כתיבה. הכול
 * רכיב-שרת עם קישורים אמיתיים (ראו `HomePathEntry`).
 */
export function HomePathSelector() {
  return (
    <section
      id="path"
      className="path-awaken scroll-mt-20 py-5 sm:py-10"
      aria-labelledby="path-heading"
    >
      <Container>
        <div className="path-intro mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">{homePathUi.eyebrow}</span>
          <h2 id="path-heading" className="type-h2 mt-2">
            {homePathUi.heading}
          </h2>
          <p className="type-lead mx-auto mt-3 max-w-[46ch] text-foreground-muted [text-wrap:pretty]">
            {homePathUi.sub}
          </p>
        </div>

        <HomePathEntry />
      </Container>
    </section>
  );
}
