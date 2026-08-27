/**
 * קובץ ההגדרות המרכזי של האתר.
 *
 * זהו מקור האמת היחיד לכל נתון עסקי: פרטי קשר, תמונות, רשתות חברתיות ודגלי
 * תכונות (feature flags). כל ערך שמסומן `PLACEHOLDER` הוא נתון זמני שיש להחליף
 * לפני עלייה לאוויר - הוא אינו עובדה אמיתית על הספר או העסק.
 *
 * הרכישה מתבצעת ב-Amazon בלבד — אין באתר מכירה ישירה, מחיר, סליקה או הזמנות.
 *
 * כדי לעדכן תמונות, פרטי קשר או להפעיל/לכבות תכונה - יש לערוך רק את הקובץ הזה.
 * אין לשכפל את הנתונים האלה בקבצים אחרים.
 */

/**
 * כתובת הבסיס הקנונית של האתר. משמשת ל-canonical, ל-OG/Twitter, ל-sitemap
 * ול-JSON-LD. מקור אמת יחיד לדומיין.
 *
 * מדרג נפילה מכוון: NEXT_PUBLIC_SITE_URL (אם הוגדר) ← דומיין הפרודקשן הקבוע
 * ← localhost (פיתוח בלבד). אנחנו לעולם *לא* נגזור canonical מ-VERCEL_URL:
 * כתובת ה-deployment של Vercel משתנה בין preview ל-preview, וקנוניקל שמצביע
 * אליה יפצל אותות אינדוקס. Preview deployments אמורים לקנן אל הפרודקשן.
 */
const PRODUCTION_URL = "https://www.zachi.co.il";

function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      // הגנת אינדוקס: לעולם לא לקנן אל דומיין preview של Vercel (…​.vercel.app).
      // כתובת ה-deployment משתנה בין preview ל-preview, וקנוניקל שמצביע אליה
      // מפצל אותות אינדוקס. אם NEXT_PUBLIC_SITE_URL הוגדר בטעות לכתובת preview
      // (או לכל כתובת לא-תקינה) — מתעלמים ממנו ונופלים לדומיין הפרודקשן הקבוע.
      if (!new URL(explicit).host.endsWith(".vercel.app")) return explicit;
    } catch {
      // כתובת לא תקינה — מתעלמים ונופלים לברירת המחדל.
    }
  }
  if (process.env.NODE_ENV === "production") return PRODUCTION_URL;
  return "http://localhost:3000";
}

export const siteConfig = {
  url: resolveSiteUrl(),

  bookTitle: "מדייטים לאהבה",
  tagline: "דייטינג הוא חיפוש. אהבה היא בנייה.",
  description:
    "ספר אחד לשלוש תחנות בדרך לאהבה: רווקים שרוצים להיכנס לקשר, גרושים שמתחילים מחדש וזוגות שרוצים להעמיק את הקשר. דייטינג הוא חיפוש; אהבה נבנית, ובתוך קשר אנחנו פוגשים גם את עצמנו.",

  /** גרסת שנה דינמית לזכויות היוצרים בפוטר - אין צורך לעדכן ידנית. */
  get copyrightYear() {
    return new Date().getFullYear();
  },

  author: {
    // שם המחבר כפי שמופיע על הכריכה. הטקסטים מציגים תובנות והתבוננות בלבד -
    // אין לייחס לצחי חן הכשרה, מקצוע טיפולי או תארים שאינם קיימים.
    name: "צחי חן",
    shortBio:
      "זיהיתי קושי משותף אצל רווקים, גרושים וזוגות, ומתוכו כתבתי את מדייטים לאהבה: דרך מעשית להבין שאהבה טובה נבנית ולא רק נמצאת, ושבתוך קשר אנחנו פוגשים גם את עצמנו.",
    photo: "/images/author/zachi-chen-960.jpg",
    photoAlt: "צחי חן, מחבר הספר מדייטים לאהבה",
    /**
     * קובץ שמע אמיתי של צחי חן ("למה כתבתי את הספר הזה"). כל עוד ריק —
     * מוצג placeholder מכובד עם התמלול בלבד. אין לייצר קול מלאכותי.
     * יש להוסיף כאן נתיב לקובץ תחת /public (למשל "/audio/why-i-wrote.mp3").
     */
    audioSrc: "",

    /**
     * פרופילים חיצוניים *אמיתיים ומאומתים* של המחבר בלבד — למשל עמוד המחבר
     * ב-Amazon, פרופיל רשמי ברשת חברתית, עמוד מחבר אצל מוכר ספרים, או ערך
     * מאומת. הערכים נפלטים כ-`sameAs` בסכימת ה-Person ומחברים את הישות
     * „צחי חן” למקורות המאמתים אותה (חיזוק זיהוי-ישות למנועי חיפוש/AI).
     *
     * ריק כברירת מחדל — כל עוד ריק, לא נפלט `sameAs` כלל. אין להוסיף כאן
     * פרופיל שאינו קיים ומאומת (איסור המצאת אישוש/authority). מוסיפים כתובת
     * רק לאחר שהיא פעילה ואומתה שהיא באמת של המחבר.
     */
    sameAs: [
      // פרופיל המרצה/מחבר של צחי חן ב-Funzing — אומת ע"י בעל האתר כשייך לצחי חן.
      // מזהה-ישות בלבד (פרופיל המשתמש), לא כתובת הרצאה/אירוע. אין להעתיק ממנו
      // ביוגרפיה, תארים, מומחיות או כל טענה — הוא משמש רק כ-sameAs לזיהוי הישות.
      "https://il.funzing.com/users/420702",
    ] as string[],
  },

  contact: {
    email: "zachi@zachi.co.il",
    phone: "",
  },

  /** רשתות חברתיות. שדה ריק = לא מוצג בפוטר. */
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
  },

  business: {
    /** שם העסק/העוסק לצורך הצהרות משפטיות. */
    legalName: "PLACEHOLDER: שם העסק / עוסק מורשה",
    /** מספר עוסק מורשה/ח.פ, אם רלוונטי. */
    registrationNumber: "",
    address: "PLACEHOLDER: כתובת רשומה",
  },

  images: {
    cover: "/images/book-cover-final.webp",
    coverAlt: `כריכת הספר "מדייטים לאהבה"`,
    mockup3d: "/images/book-cover-final.webp",
    mockup3dAlt: `הדמיית תלת-ממד של הספר "מדייטים לאהבה"`,
    workbookMockup: "/images/bonus/workbook-mockup.svg",
    workbookMockupAlt: "הדמיית חוברת העבודה הדיגיטלית המצורפת לספר",
  },

  /** דגלי תכונות - שולטים אילו חלקים באתר מוצגים. */
  features: {
    cookieConsent: true,
  },

  /** אנליטיקה - כבוי כברירת מחדל. מזינים מזהים דרך משתני סביבה. */
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID ?? "",
    googleTagManagerId: process.env.NEXT_PUBLIC_GTM_ID ?? "",
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  },

  /**
   * הספר זמין *עכשיו* לרכישה ב-Amazon Kindle (המהדורה העברית). זהו מקור האמת
   * היחיד לכל קישור רכישה חיצוני. הרכישה מתבצעת בפלטפורמת Amazon בלבד — אין
   * סליקה מקומית ואין checkout באתר. ASIN אושר ע"י המחבר.
   */
  amazon: {
    available: true,
    asin: "B0GJ3SL9H2",
    /** קישור המוצר הקנוני (external). */
    url: "https://www.amazon.com/dp/B0GJ3SL9H2",
    editionLabel: "מהדורת Kindle",
    /** מזהה-פורמט מכונה לאנליטיקה (book_format) — לא PII. תואם ל-editionLabel. */
    format: "kindle",
    /** מיסגור זמינות אחיד לכל האתר. */
    availableLabel: "זמין עכשיו במהדורת Kindle באמזון",
    buyLabel: "לרכישה באמזון",
  },

  /**
   * המהדורה האנגלית — מקור אמת יחיד ל-/en. נפרדת לחלוטין מ-`amazon` שלמעלה:
   * זו רשומת אמזון *אחרת*, עם ASIN אחר, שם אחר ואיות-מחבר אחר. אסור לקשר
   * מ-/en אל ASIN המהדורה העברית — קורא אנגלי היה נוחת על ספר בעברית.
   *
   * מקורות (אין כאן שום שדה מומצא):
   *   • asin/url — אושרו במפורש ע"י המחבר. הם הסמכות לקיום המהדורה וליעד.
   *   • title/subtitle/author/format — מתוך כותרת עמוד המוצר של אותה כתובת
   *     בדיוק, כפי שהיא מופיעה במנוע חיפוש ציבורי. תיאום *עקיף*: אמזון עצמה
   *     חסומה מסביבת הבנייה, ולכן זהו אישוש ולא אימות ישיר.
   *   • isbn — **לא מוגדר בכוונה.** ה-ISBN שנמצא בחיפוש (9798312146646)
   *     שייך לספר אחר של אותו מחבר (B0DYP6PC12) ואינו של המהדורה הזו.
   *   • cover — קובץ מקומי שסופק ואושר ע"י המחבר. **בכוונה בשם נפרד**
   *     מהעטיפה העברית (`book-cover-final.webp`), כדי ששתי המהדורות לא
   *     יוכלו להתחלף בטעות. אין hotlink לאמזון — CSP חוסם תמונות חיצוניות.
   */
  englishEdition: {
    available: true,
    asin: "B0DYP4DL1V",
    /** היעד הקנוני היחיד לכל CTA ב-/en. */
    url: "https://www.amazon.com/dp/B0DYP4DL1V",
    /** עטיפת המהדורה האנגלית. 1400×2069, יחס-הצדדים המקורי נשמר. */
    cover: "/images/book-cover-en.webp",
    coverWidth: 1400,
    coverHeight: 2069,
    coverAlt: "Dating to Love by Zachi Hen — English edition cover",
    title: "Dating to Love",
    subtitle:
      "A Practical Guide to Choosing the Right Partner, Avoiding Red Flags, and Building a Healthy Relationship",
    author: "Zachi Hen",
    format: "Kindle edition",
    buyLabel: "Buy on Amazon",
  },
} as const;

export type SiteConfig = typeof siteConfig;
