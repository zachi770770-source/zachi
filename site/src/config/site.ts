/**
 * קובץ ההגדרות המרכזי של האתר.
 *
 * זהו מקור האמת היחיד לכל נתון עסקי: מחיר, משלוח, פרטי קשר, תמונות, רשתות
 * חברתיות ודגלי תכונות (feature flags). כל ערך שמסומן `PLACEHOLDER` הוא נתון
 * זמני שיש להחליף לפני עלייה לאוויר - הוא אינו עובדה אמיתית על הספר או העסק.
 *
 * כדי לעדכן מחיר, תמונות, פרטי קשר או להפעיל/לכבות תכונה - יש לערוך רק את
 * הקובץ הזה. אין לשכפל את הנתונים האלה בקבצים אחרים.
 */

export const currency = "ILS" as const;

/**
 * מחיר המהדורה הדיגיטלית בש"ח - מקור האמת היחיד לחישוב הזמנה דיגיטלית.
 * מחיר המהדורה המודפסת טרם נקבע ולכן אינו מוגדר כאן (ראו products.formats).
 */
const digitalPrice = 98;

/**
 * כתובת הבסיס של האתר. יש להגדיר NEXT_PUBLIC_SITE_URL בסביבת הפרודקשן
 * (חובה - בלעדיה ה-canonical, ה-OG tags, ה-sitemap וכתובות ה-redirect
 * של הסליקה יצביעו לכתובת שגויה). כרשת ביטחון בלבד - אם המשתנה לא
 * הוגדר אך האתר רץ ב-Vercel, נשתמש בכתובת ה-deployment האוטומטית של
 * Vercel (VERCEL_URL) במקום ליפול חזרה ל-localhost בפרודקשן.
 */
function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  url: resolveSiteUrl(),

  bookTitle: "מדייטים לאהבה",
  tagline: "דייטינג הוא חיפוש. אהבה היא בנייה.",
  description:
    "ספר אחד לשלוש תחנות בדרך לאהבה: רווקים שרוצים להיכנס לקשר, גרושים שמתחילים מחדש וזוגות שרוצים להעמיק את הקשר. דייטינג הוא חיפוש; אהבה נבנית — ובתוך קשר אנחנו פוגשים גם את עצמנו.",

  /** גרסת שנה דינמית לזכויות היוצרים בפוטר - אין צורך לעדכן ידנית. */
  get copyrightYear() {
    return new Date().getFullYear();
  },

  author: {
    // שם המחבר כפי שמופיע על הכריכה. הטקסטים מציגים תובנות והתבוננות בלבד -
    // אין לייחס לצחי חן הכשרה, מקצוע טיפולי או תארים שאינם קיימים.
    name: "צחי חן",
    shortBio:
      "צחי חן זיהה קושי משותף אצל רווקים, גרושים וזוגות — ומתוכו כתב את מדייטים לאהבה: דרך מעשית להבין שאהבה טובה נבנית ולא רק נמצאת, ושבתוך קשר אנחנו פוגשים גם את עצמנו.",
    photo: "/images/author/author-photo.svg",
    photoAlt: "צחי חן, מחבר הספר מדייטים לאהבה",
  },

  contact: {
    email: "PLACEHOLDER-contact@example.com",
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
    legalName: "PLACEHOLDER — שם העסק / עוסק מורשה",
    /** מספר עוסק מורשה/ח.פ, אם רלוונטי. */
    registrationNumber: "",
    address: "PLACEHOLDER — כתובת רשומה",
  },

  images: {
    cover: "/images/book-cover-final.webp",
    coverAlt: `כריכת הספר "מדייטים לאהבה"`,
    mockup3d: "/images/book-cover-final.webp",
    mockup3dAlt: `הדמיית תלת-ממד של הספר "מדייטים לאהבה"`,
    workbookMockup: "/images/bonus/workbook-mockup.svg",
    workbookMockupAlt: "הדמיית חוברת העבודה הדיגיטלית המצורפת לספר",
  },

  /**
   * פרטי המהדורה הדיגיטלית - נמסרת כקובץ להורדה ובמייל לאחר תשלום מאובטח.
   */
  digital: {
    isDigital: true,
    /**
     * הפעילו `formatsConfirmed` אך ורק כאשר קובצי המוצר הסופיים קיימים
     * בפועל. כל עוד false - האתר לא יטען שהפורמטים מוכנים, אלא ידבר על
     * "קובץ דיגיטלי" בלבד.
     */
    formatsConfirmed: false,
    /** יוצג רק כאשר formatsConfirmed=true. */
    formats: ["PDF", "EPUB"] as const,
    deliveryMethod: "קישור הורדה מאובטח + עותק במייל",
    devices: "נייד, טאבלט, מחשב וקוראים אלקטרוניים תואמים",
  },

  /**
   * מהדורות המוצר. הספר נמכר בשני פורמטים נפרדים - דיגיטלי ומודפס - וכן
   * חבילה המשלבת את שניהם. כל מהדורה מנוהלת כאן בלבד.
   *
   * יושרה: מחיר המהדורה המודפסת ועלות המשלוח טרם נקבעו. עד שייקבעו ערכים
   * אמיתיים, `physical` ו-`bundle` מסומנים `available: false`, מוצגים כ"בקרוב"
   * ואי אפשר לשלם עליהם. אין להמציא מחיר או מחיר משלוח. כדי לפתוח מהדורה:
   * הזינו מחיר אמיתי, קבעו מדיניות משלוח (ראו `shipping`) והפכו את `available`
   * ל-true.
   */
  products: {
    /** הפורמט שנבחר כברירת מחדל בבורר. */
    defaultFormat: "digital" as "digital" | "physical" | "bundle",
    formats: {
      digital: {
        id: "digital" as const,
        label: "ספר דיגיטלי",
        shortLabel: "דיגיטלי",
        tagline: "גישה מיידית לקריאה בכל מכשיר",
        /** מחיר המהדורה - מקור האמת לחישוב הזמנה. */
        price: digitalPrice as number | null,
        available: true,
        /** האם נדרשת כתובת למשלוח פיזי. */
        requiresShipping: false,
      },
      physical: {
        id: "physical" as const,
        label: "ספר מודפס",
        shortLabel: "מודפס",
        tagline: "עותק פיזי שיישלח אליכם בדואר",
        /** טרם נקבע - אין להמציא. יוגדר לפני פתיחת המהדורה. */
        price: null as number | null,
        available: false,
        requiresShipping: true,
      },
      bundle: {
        id: "bundle" as const,
        label: "דיגיטלי + מודפס",
        shortLabel: "שניהם",
        tagline: "לקרוא כבר עכשיו דיגיטלית ולקבל גם עותק מודפס",
        /** תלוי במחיר המהדורה המודפסת - טרם נקבע. */
        price: null as number | null,
        available: false,
        requiresShipping: true,
      },
    },
  },

  /**
   * משלוח - רלוונטי אך ורק למהדורה מודפסת. הערכים טרם נקבעו; כל עוד המהדורה
   * המודפסת אינה available, בלוק זה אינו בשימוש בפועל. אין להמציא ערכים.
   */
  shipping: {
    flatRate: null as number | null,
    freeShippingThreshold: null as number | null,
    estimatedDeliveryText: "",
  },

  /** מחיר - מקור האמת היחיד לחישובי הזמנה (מהדורה דיגיטלית). */
  commerce: {
    currency,
    /** מחיר המהדורה הדיגיטלית בש"ח. */
    price: digitalPrice,
    /**
     * מחיר "לפני הנחה" - יוצג רק אם `compareAtPrice` גדול מ-`price` וגם
     * `showCompareAtPrice` מופעל. אין להמציא הנחה שלא התקיימה בפועל.
     */
    compareAtPrice: null as number | null,
    showCompareAtPrice: false,

    availability: "in_stock" as "in_stock" | "preorder" | "out_of_stock",

    /**
     * הצעות כמות = מספר עותקי גישה (לרכישה עצמית או כמתנה דיגיטלית).
     * כל הצעה ניתנת להפעלה/כיבוי בנפרד.
     */
    quantityOffers: [
      { quantity: 1, label: "עותק אחד", enabled: true, note: undefined as string | undefined },
      {
        quantity: 2,
        label: "שני עותקים",
        enabled: true,
        note: "מתנה דיגיטלית לאדם שחשוב לכם",
      },
      {
        quantity: 3,
        label: "שלושה עותקים",
        enabled: true,
        note: "לשתף עם מי שאיכפת לכם ממנו",
      },
    ],

    /** הקדשה אישית - הפעילו רק אם יש בפועל שירות כזה מאחורי הקלעים. */
    giftDedicationEnabled: false,
  },

  /**
   * שורת נתונים אמיתיים בלבד מתחת ל-CTA ב-Hero. אין טענות שאינן נכונות.
   * "secure-payment" מסומן demoHidden: כל עוד מחובר ספק תשלום הדגמה (Mock)
   * אין להציג "תשלום מאובטח", והרכיב מסתיר אותו אוטומטית.
   */
  trustBar: [
    { id: "secure-payment", label: "תשלום מאובטח", enabled: true, demoHidden: true },
    { id: "download", label: "גישה בהורדה ובמייל", enabled: true },
    { id: "devices", label: "קריאה בנייד, בטאבלט ובמחשב", enabled: true },
    { id: "guest", label: "מהדורה דיגיטלית — גישה מיידית", enabled: true },
  ],

  bonus: {
    enabled: true,
    title: "חוברת העבודה של מדייטים לאהבה",
    /** האם החוברת כלולה במחיר הספר כברירת מחדל. */
    includedInPrice: true,
    format: "קובץ דיגיטלי למילוי עצמי במחשב או בטלפון",
    deliveryTiming: "נכללת בגישה שתישלח אליכם במייל",
    personalUseOnly: true,
  },

  /** דגלי תכונות - שולטים אילו חלקים באתר מוצגים. */
  features: {
    testimonials: false, // יופעל אוטומטית רק כאשר תתווסף המלצה מאושרת אחת לפחות
    newsletter: true,
    bonusSection: true,
    giftDedication: false,
    stickyPurchaseBar: true,
    cookieConsent: true,
  },

  /** אנליטיקה - כבוי כברירת מחדל. מזינים מזהים דרך משתני סביבה. */
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID ?? "",
    googleTagManagerId: process.env.NEXT_PUBLIC_GTM_ID ?? "",
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  },

  /** האם סביבת התשלום היא הדגמה בלבד (אין ספק סליקה אמיתי מחובר). */
  isPaymentDemoMode: (process.env.PAYMENT_PROVIDER ?? "mock") === "mock",

  /**
   * מצב Pre-launch: האתר ציבורי אך המכירה סגורה. כל עוד false — אי אפשר
   * ליצור הזמנה, לבצע תשלום (גם לא Mock) או להגיע ל-checkout; ה-CTA מציג
   * "המכירה תיפתח בקרוב". יש להפוך ל-true רק לאחר חיבור כריכה סופית, קובץ
   * ספר, סליקה אמיתית ו-fulfillment מלא.
   */
  salesOpen: false,

  /** תווית מחיר לתקופת ה-Pre-launch. */
  preLaunchPriceLabel: "בקרוב — הספר הדיגיטלי ב-98 ₪",
} as const;

export type SiteConfig = typeof siteConfig;
