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

export const siteConfig = {
  /** כתובת הבסיס של האתר. יש להגדיר NEXT_PUBLIC_SITE_URL בסביבת הפרודקשן. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  bookTitle: "מדייטים לאהבה",
  tagline: "דייטינג הוא חיפוש. אהבה היא בנייה.",
  description:
    "ספר מעשי לאנשים שרוצים להפסיק לבחון קשרים רק מבחוץ — ולהתחיל להבין כיצד קשר טוב באמת נבנה.",

  /** גרסת שנה דינמית לזכויות היוצרים בפוטר - אין צורך לעדכן ידנית. */
  get copyrightYear() {
    return new Date().getFullYear();
  },

  author: {
    name: "PLACEHOLDER — שם המחבר/ת",
    shortBio:
      "PLACEHOLDER — כמה משפטים על המחבר/ת יופיעו כאן. יש להחליף בטקסט אמיתי בקובץ src/content/author.ts.",
    photo: "/images/author/author-photo.svg",
    photoAlt: "PLACEHOLDER — תמונת המחבר/ת של מדייטים לאהבה",
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
    cover: "/images/book/cover-front.svg",
    coverAlt: `כריכת הספר "מדייטים לאהבה"`,
    mockup3d: "/images/book/mockup-3d.svg",
    mockup3dAlt: `הדמיית תלת-ממד של הספר "מדייטים לאהבה"`,
    workbookMockup: "/images/bonus/workbook-mockup.svg",
    workbookMockupAlt: "הדמיית חוברת העבודה הדיגיטלית המצורפת לספר",
  },

  /** מחיר ומשלוח - מקור האמת היחיד לחישובי הזמנה. */
  commerce: {
    currency,
    /** PLACEHOLDER — מחיר עותק בודד בש"ח. יש לעדכן למחיר האמיתי. */
    price: 98,
    /**
     * מחיר "לפני הנחה" - יוצג רק אם `compareAtPrice` גדול מ-`price` וגם
     * `showCompareAtPrice` מופעל. אין להמציא הנחה שלא התקיימה בפועל.
     */
    compareAtPrice: null as number | null,
    showCompareAtPrice: false,

    /** PLACEHOLDER — עלות משלוח קבועה בש"ח. */
    shippingFlatRate: 25,
    /** מעל סכום זה המשלוח חינם. `null` = אין מבצע משלוח חינם. */
    freeShippingThreshold: null as number | null,
    /** PLACEHOLDER — טווח זמן אספקה משוער, כפי שיוצג ללקוח. */
    estimatedDeliveryText: "3–7 ימי עסקים",

    availability: "in_stock" as "in_stock" | "preorder" | "out_of_stock",

    /** הצעות כמות. כל הצעה ניתנת להפעלה/כיבוי בנפרד. */
    quantityOffers: [
      { quantity: 1, label: "עותק אחד", enabled: true, note: undefined as string | undefined },
      {
        quantity: 2,
        label: "שני עותקים",
        enabled: true,
        note: "מתנה לאדם שחשוב לכם",
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

  /** שורת האמון מתחת לכפתורי ה-CTA ב-Hero. כל פריט ניתן לכיבוי בנפרד. */
  trustBar: [
    { id: "secure-payment", label: "תשלום מאובטח", enabled: true },
    { id: "shipping", label: "משלוח לכל הארץ", enabled: true },
    { id: "workbook", label: "כולל חוברת עבודה דיגיטלית", enabled: true },
  ],

  bonus: {
    enabled: true,
    title: "חוברת העבודה של מדייטים לאהבה",
    /** האם החוברת כלולה במחיר הספר כברירת מחדל. */
    includedInPrice: true,
    format: "קובץ PDF דיגיטלי, למימוש עצמי במחשב או בטלפון",
    deliveryTiming: "נשלחת במייל מיד לאחר אישור התשלום",
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
} as const;

export type SiteConfig = typeof siteConfig;
