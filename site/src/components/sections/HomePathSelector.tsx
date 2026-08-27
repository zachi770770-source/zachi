import { Container } from "@/components/shared/Container";
import { homePathUi } from "@/content/homePaths";
import { HomePathEntry } from "@/components/sections/HomePathEntry";
import { resolveCompassSurface } from "@/lib/compass/assistant/config";

/**
 * לב עמוד הבית: „איפה אתם נמצאים עכשיו?” — רגע ההקשבה של העמוד. הכותרת מפנה את
 * תשומת-הלב אל המבקר עצמו, ובחירת מצב פותחת שיחה קצרה עם הספר *במקום*, בלי לנווט
 * החוצה (ראו `HomePathEntry`).
 *
 * ארכיטקטורה: מעטפת-שרת (כותרת + תת-כותרת מרונדרות ב-SSR ל-SEO) עוטפת אי-לקוח
 * יחיד (`HomePathEntry`) שנושא את ארבעת הכרטיסים ואת רגע-ההקשבה. הכרטיסים עצמם
 * נשארים `<a>` אמיתיים ב-HTML (SEO + עבודה מלאה ללא הידרציה) — האינטראקציה היא
 * שכבת שיפור-הדרגתי מעליהם, לא תחליף לקישור.
 *
 * מסלול-התחנות (.path-stations) נשמר כ*מפה* של המסע. ה-IA נשמר: שלוש תחנות
 * במחזור + „אחרי פרידה” כשער מעבר (מסומן בבאדג'), ולכן השער אינו נצבע כתחנה
 * רביעית.
 */
export function HomePathSelector() {
  // מצב-התצוגה של „שאל את הספר” נקבע בשרת: כשהכתיבה-החופשית חיה (עוזר פעיל או
  // תצוגת-Preview) התיבה היא באמת שדה-כתיבה; בברירת המחדל (המצפן המודרך בלבד)
  // היא פותחת שיחה מודרכת — ולכן האפורדנס שלה מותאם בהתאם (ראו `HomePathEntry`),
  // עקבי עם `CompassLauncher` שכבר מסתעף לפי אותו מצב.
  const freeTextEnabled = resolveCompassSurface() !== "guided";
  return (
    <section id="path" className="scroll-mt-20 py-5 sm:py-10" aria-labelledby="path-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">{homePathUi.eyebrow}</span>
          <h2 id="path-heading" className="type-h2 mt-2">
            {homePathUi.heading}
          </h2>
          <p className="type-lead mx-auto mt-3 max-w-[46ch] text-foreground-muted [text-wrap:pretty]">
            {homePathUi.sub}
          </p>
        </div>

        <HomePathEntry freeTextEnabled={freeTextEnabled} />
      </Container>
    </section>
  );
}
