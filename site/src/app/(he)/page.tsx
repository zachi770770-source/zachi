import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { RecognitionBeat } from "@/components/sections/RecognitionBeat";
import { HomePathSelector } from "@/components/sections/HomePathSelector";
import { AuthorNote } from "@/components/sections/AuthorNote";
import { WhyTheBook } from "@/components/sections/WhyTheBook";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { SampleBridge } from "@/components/sections/SampleBridge";
import { DeeperEntry } from "@/components/shared/DeeperEntry";
import { BuildSpine } from "@/components/shared/BuildSpine";
import { ViewEvent } from "@/components/analytics/ViewEvent";
import { LanguageHint } from "@/components/layout/LanguageHint";
import { BookSchema } from "@/components/schema/BookSchema";
import { WebSiteSchema } from "@/components/schema/WebSiteSchema";

export const metadata = pageMetadata({
  title: `${siteConfig.bookTitle}: ספר מעשי לדייטינג ולזוגיות | ${siteConfig.author.name}`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
  // יחס-שפה הדדי מול /en. `x-default` מצביע לעברית במכוון: זו שפת האתר
  // הראשית ועמוד הבית העברי הוא הכתובת הקנונית ההיסטורית — כלומר זו באמת
  // הגרסה שמוצגת כשאין התאמת-שפה, ולא הצהרה נוחה.
  languages: { he: "/", en: "/en", "x-default": "/" },
});

/**
 * עמוד הבית — **עמוד שדרה אחד של הספר**, ללא הפרעות.
 *
 *   1. Hero            — הרעיון, הכריכה, והפעולה הראשית (טעימה).
 *   2. RecognitionBeat — „זה מדבר עליי”.
 *   3. WhyTheBook      — „מה זה ייתן לי?”. השאלה שבאה מיד אחרי הזיהוי.
 *   4. AuthorNote      — מי כתב את זה, עם פנים. אמון אחרי שיש סיבה להקשיב.
 *   5. SampleBridge    — קוראים קטע אמיתי.
 *   6. HomePathSelector— חמש נקודות-כניסה אישיות. ניווט בלבד.
 *   7. DeeperEntry     — דלת אחת, אופציונלית, אל הכלי.
 *   8. NewsletterSection — רכישה.
 *
 * מה השתנה, ולמה:
 *
 * **הסדר.** קודם הרצף היה Hero → זיהוי → סצנה → *בחירת-מצב* → מחבר → למה ספר
 * → רכישה. כלומר המבקר התבקש לסווג את עצמו, ואז לעבור תרגיל בן ארבעה שלבים,
 * לפני שראה מי כתב את הספר ולפני שנאמר לו מה הספר בכלל נותן. האמון והטיעון
 * עלו למעלה; ההתאמה האישית ירדה למטה, למקום של ניווט.
 *
 * ואז הוחלפו גם השניים ביניהם: „למה בכלל ספר” עלה לפני „מי כתב”. מיד אחרי
 * שהמבקר מזהה את עצמו הוא שואל „מה זה ייתן לי” — לא „מי אתה”. סיפור-המחבר
 * עונה על שאלה שנשאלת רק אחרי שיש סיבה להקשיב, ולכן הוא בא שני.
 *
 * **SearchToBuild הוסר.** הסצנה נמדדה: היא מתייצבת מחוץ למסך, וברוב הגלילות
 * נראית כשורת-כיתוב ותשע נקודות. הגרסה החזקה שלה — מילות-הספק שמתלכדות —
 * קיימת ב-`ThesisSection` שב-/book ונשארת שם. בנוסף היא נשאה את המשפט
 * „דייטינג הוא חיפוש. אהבה היא בנייה.” בפעם השלישית באותו עמוד (Hero, סצנה,
 * פוטר). מחיקה, לא שכפול.
 *
 * **StickyCta הוסר** לטובת `SampleBridge` — אותה הזמנה, בתוך הזרימה, בלי
 * לכסות את ה-CTA הסוגר במובייל.
 *
 * **אין באתר יותר שאלון בזרימה הראשית.** הכלי נכנס רק דרך `DeeperEntry`.
 */
export default function HomePage() {
  return (
    <>
      <ViewEvent event="home_viewed" />
      {/* רמיזה לא-הורסת לדוברי אנגלית. אינה מנתבת ואינה משנה תוכן — ראו
          ההסבר ב-LanguageHint על למה לא הפניית Accept-Language. */}
      <LanguageHint />
      <WebSiteSchema />
      <BookSchema />
      <BuildSpine />
      <Hero />
      <RecognitionBeat />
      {/* התשובה לשאלה שנשאלת מיד אחרי הזיהוי: „מה זה ייתן לי?” */}
      <WhyTheBook />
      {/* ואז — מי כתב את זה, ולמה. אמון אחרי שיש סיבה להקשיב. */}
      <AuthorNote />
      {/* הטעימה, כצעד בזרימה — לא כבר צף שמכסה את הסגירה. */}
      <SampleBridge />
      {/* התאמה אישית = ניווט. חמש נקודות-כניסה, לחיצה אחת כל אחת. */}
      <HomePathSelector />
      {/* הדלת היחידה אל השכבה העמוקה, בעוצמה של קישור-טקסט. */}
      <DeeperEntry className="deeper-entry--home" />
      <NewsletterSection />
    </>
  );
}
