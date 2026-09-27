import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { compassQuiz } from "@/content/compass";
import { askStations, type AskStationId } from "@/content/askRoute";
import {
  COMPASS_LIMITS,
  resolveCompassSurface,
} from "@/lib/compass/assistant/config";
import { Container } from "@/components/shared/Container";
import { GuidedCompass } from "@/components/compass/GuidedCompass";
import { CompassExperience } from "@/components/compass/CompassExperience";

export const metadata: Metadata = {
  ...pageMetadata({
    // metaTitle כבר כולל „| מדייטים לאהבה”; absoluteTitle מונע הכפלת הסיומת ע"י תבנית ה-<title>.
    title: compassQuiz.metaTitle,
    absoluteTitle: true,
    description: compassQuiz.metaDescription,
    path: "/compass",
    ogType: "article",
  }),
  // המצפן הוא כלי-ניווט אינטראקטיבי („מאיפה להתחיל בספר”), בלי כוונת-חיפוש
  // עצמאית — ולכן noindex, אבל follow: הקישורים שהוא מוביל אליהם (תחנות, כלים,
  // הספר) ממשיכים להיסרק. הוסר גם מה-sitemap. מחוץ לפרודקשן נשמר ה-nofollow
  // של ה-layout, כדי ש-Preview לא יפתח סריקה של עצמו.
  robots:
    process.env.VERCEL_ENV === "production"
      ? { index: false, follow: true }
      : { index: false, follow: false },
};

/**
 * עמוד „שאל את הספר” (/compass) — דו-מצבי לפי מצב-התצוגה שנקבע בשרת
 * (resolveCompassSurface):
 *
 *   • "guided" (ברירת מחדל, וגם פרודקשן) — המצפן המודרך בלבד: מנוע הכוונה סגור
 *     ודטרמיניסטי (AskRoute). זו ההתנהגות החיה הקיימת; הממשק החופשי אינו נחשף.
 *   • "free-text-preview" — Preview/Staging: הממשק החופשי נראה וניתן לבדיקה
 *     ויזואלית, אך אינו מפיק מענה (uiPreview). לבדיקה בלבד.
 *   • "free-text-live" — העוזר הופעל: הממשק החופשי שולח דרך /api/compass האמיתי
 *     (שעדיין מגודר במסד/ספק/גרסה). המצפן המודרך נשאר זמין כמצב משני.
 *
 * הקשר-מסע מהבית (`?station=<id>`) נשמר בשני המסלולים: כשהתחנה ידועה, המנוע
 * המודרך מדלג על שאלת „איפה אתם?” ומתחיל בדילמה.
 */
export default async function CompassPage({
  searchParams,
}: {
  searchParams: Promise<{ station?: string }>;
}) {
  const { station } = await searchParams;
  const initialStation: AskStationId | undefined =
    station && askStations.some((s) => s.id === station)
      ? (station as AskStationId)
      : undefined;

  const surface = resolveCompassSurface();

  // ── מצב שאלה-חופשית (Preview/Staging או עוזר-פעיל) ──────────────────────────
  // הממשק החופשי הוא הראשי; „המצפן המודרך” הוא מצב משני בתוך אותה חוויה.
  if (surface !== "guided") {
    return (
      <Container className="pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20">
        <div className="enter-stagger">
          <CompassExperience
            maxQuestionChars={COMPASS_LIMITS.maxQuestionChars}
            uiPreview={surface === "free-text-preview"}
            initialStation={initialStation}
          />
        </div>
      </Container>
    );
  }

  // ── מצב מודרך (ברירת מחדל / פרודקשן) — עם „מצב-תגובה”: הפתיח מתקפל בתשובה ──────
  return (
    <Container className="pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20">
      <GuidedCompass initialStation={initialStation} />
    </Container>
  );
}
