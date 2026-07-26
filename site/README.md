# מדייטים לאהבה - אתר מכירה

> דייטינג הוא חיפוש. אהבה היא בנייה.

אתר מכירה ממוקד להמרה עבור הספר "מדייטים לאהבה". בנוי ב-Next.js 16 (App
Router), TypeScript (strict), Tailwind CSS 4 ו-RTL מלא בעברית.

---

## תוכן העניינים

1. [הרצה מקומית](#הרצה-מקומית)
2. [Build ובדיקות](#build-ובדיקות)
3. [פריסה ל-Vercel](#פריסה-ל-vercel)
4. [עריכת תוכן, מחיר ותמונות](#עריכת-תוכן-מחיר-ותמונות)
5. [חיבור ספק סליקה אמיתי](#חיבור-ספק-סליקה-אמיתי)
6. [חיבור בסיס נתונים](#חיבור-בסיס-נתונים)
7. [אנליטיקה ועוגיות](#אנליטיקה-ועוגיות)
8. [מבנה הפרויקט](#מבנה-הפרויקט)
9. [מה עדיין דורש תוכן אמיתי](#מה-עדיין-דורש-תוכן-אמיתי)

---

## הרצה מקומית

דרישות: Node.js 20.9+ ו-npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

האתר יעלה בכתובת [http://localhost:3000](http://localhost:3000).

## Build ובדיקות

```bash
npm run build       # build של Next.js (כולל בדיקת TypeScript)
npm run lint         # ESLint
npm run test         # בדיקות יחידה (Vitest)
npm run test:watch   # בדיקות יחידה במצב watch
npm run test:e2e     # בדיקת Playwright למסלול רכישה מלא (מריצה build+start אוטומטית)
```

כל הפקודות אמורות לעבור נקי לפני commit.

## פריסה ל-Vercel

1. חברו את הריפו ב-Vercel, עם **Root Directory** מוגדר לתיקיית `site`
   (אם ה-repo מכיל גם תוכן אחר מחוץ לאתר).
2. הגדירו את משתני הסביבה מתוך `.env.example` בפאנל Vercel
   (Settings → Environment Variables). לכל הפחות יש להגדיר
   `NEXT_PUBLIC_SITE_URL` לכתובת הפרודקשן האמיתית.
3. הריצו Deploy. אין צורך בקונפיגורציה נוספת - `next build` הוא פקודת
   ה-build שVercel מזהה אוטומטית.

**חשוב:** כל עוד `PAYMENT_PROVIDER=mock` (ברירת המחדל), האתר יעלה
ויעבוד מקצה לקצה, אך מסך התשלום יציג בבירור שמדובר במצב Demo/Test ולא
בסליקה אמיתית. וכל עוד לא חובר בסיס נתונים אמיתי, הזמנות נשמרות
בזיכרון בלבד ולא ישרדו אתחול שרת - ראו סעיפים הבאים לפני מכירה אמיתית.

---

## עריכת תוכן, מחיר ותמונות

כל הנתונים העסקיים וה-copy מרוכזים בקבצים הבאים - **אין צורך לחפש
טקסטים בתוך הרכיבים**:

| קובץ | מה עורכים בו |
| --- | --- |
| `src/config/site.ts` | מחיר, מטבע, עלות משלוח, זמינות, הנחות, הצעות כמות, בונוס, פרטי קשר, רשתות חברתיות, נתיבי תמונות, דגלי תכונות (feature flags) |
| `src/config/nav.ts` | קישורי הניווט בהדר ובפוטר |
| `src/content/book.ts` | Hero, אזור הבעיה, הרעיון הגדול, השיטה, תוצאות, כלים, הצצה לספר |
| `src/content/author.ts` | תוכן "על המחבר" |
| `src/content/faq.ts` | שאלות ותשובות (מקור אמת יחיד - גם ל-UI וגם ל-Schema) |
| `src/content/testimonials.ts` | המלצות קוראים - **ריק בכוונה**, ראו הסבר למטה |
| `src/content/legal.ts` | תקנון, פרטיות, משלוחים והחזרות |

### מחיר ומשלוח

עריכת `siteConfig.commerce` ב-`src/config/site.ts` משנה את המחיר בכל
מקום באתר (Hero, כרטיס רכישה, Checkout, Schema.org, ואת חישוב הסכום
בצד השרת). אין מקום נוסף שבו צריך לעדכן מחיר.

### תמונות

התמונות הנוכחיות (`public/images/**`) הן **placeholders טיפוגרפיים**
שנוצרו במיוחד לפרויקט (SVG, לא stock photos), עם טקסט "PLACEHOLDER"
ברור על גביהן. להחלפה:

1. שימו את קובץ התמונה החדש תחת `public/images/...`.
2. עדכנו את הנתיב המתאים תחת `siteConfig.images` ב-`src/config/site.ts`.

נכסים שצריך להחליף לפני עלייה לאוויר: כריכת הספר, הדמיית תלת-ממד,
תמונת המחבר, הדמיית חוברת העבודה. ה-OG image והפאביקון נוצרים
דינמית (`src/app/opengraph-image.tsx`, `icon.tsx`, `apple-icon.tsx`)
ומשתמשים בטקסט מתוך `siteConfig` - הם יתעדכנו אוטומטית ברגע שהמידע
בקובץ ההגדרות משתנה.

### המלצות קוראים (Testimonials)

מערך `testimonials` ב-`src/content/testimonials.ts` מתחיל ריק
בכוונה - **אין באתר שום המלצה מומצאת**. ה-Section מוסתר לגמרי
מלקוחות כל עוד המערך ריק, ומוצג אוטומטית ברגע שמוסיפים לו פריט אחד
לפחות לפי המבנה המתועד בקובץ.

---

## חיבור ספק סליקה אמיתי

שכבת התשלומים בנויה כ-abstraction (`src/lib/payments/types.ts`,
ממשק `PaymentProvider`) בדיוק כדי לאפשר להחליף ספק בלי לגעת בקוד
ה-checkout:

1. צרו קובץ חדש, למשל `src/lib/payments/tranzilaProvider.ts`,
   שמממש את הממשק `PaymentProvider`:
   - `createPaymentSession` - פותח עסקה אצל הספק ומחזיר redirect URL.
   - `verifyPayment` - בדיקת סטטוס עסקה.
   - `handleWebhook` - **אימות חתימה** ועיבוד אירוע מהספק (success/failed/pending/cancelled).
   - `refundPayment` - הכנה לזיכוי כספי עתידי.
2. רשמו את המימוש החדש ב-`getPaymentProvider()`
   (`src/lib/payments/index.ts`), לפי ערך `PAYMENT_PROVIDER`.
3. הגדירו את משתני הסביבה `PAYMENT_PROVIDER`, `PAYMENT_API_KEY`,
   `PAYMENT_SECRET`, `PAYMENT_TERMINAL_ID`, `PAYMENT_WEBHOOK_SECRET`.

**לא נדרש שינוי** ב-`app/api/checkout/route.ts`, ב-`CheckoutForm`
או בעמוד התודה - כולם עובדים מול הממשק בלבד.

עד אז, `PAYMENT_PROVIDER=mock` (ברירת המחדל) מפעיל ספק הדגמה: מסך
תשלום פנימי ב-`/checkout/pay/[sessionId]` עם כפתורי "הצליח / נכשל /
בוטל" שמדמים בדיוק את זרימת ה-webhook האמיתית (כולל אימות חתימה
HMAC), בלי לבצע שום חיוב. מסך זה מסומן בבירור כ-Demo/Test.

**אבטחה:** אין ולא יהיה קוד ששומר פרטי כרטיס אשראי בשרת של האתר.
כל תקשורת עם פרטי תשלום מתבצעת מול ספק הסליקה עצמו (redirect/iframe/tokenization).

## חיבור בסיס נתונים

הזמנות נשמרות כרגע במימוש בזיכרון (`InMemoryOrderRepository`) - נוח
לפיתוח והדגמה, אך **אינו מתאים לפרודקשן אמיתי**: הנתונים נמחקים
בכל restart של השרת ואינם משותפים בין מספר instances.

שכבת האחסון בנויה כ-abstraction (`OrderRepository`,
`src/lib/orders/repository.ts`) כדי לאפשר חיבור PostgreSQL/Supabase
בלי לשנות קוד ב-API routes:

1. ראו את התבנית המלאה (לא מחוברת) ב-
   `src/lib/orders/postgresRepository.example.ts` - היא ממשת את
   `OrderRepository` באמצעות שאילתות SQL סטנדרטיות.
2. התקינו קליינט DB (`npm install pg` או `@supabase/supabase-js`).
3. צרו טבלת `orders` בהתאם לשדות ב-`src/lib/orders/types.ts`.
4. עדכנו את `getOrderRepository()` ב-`src/lib/orders/index.ts`
   להחזיר את המימוש החדש במקום `InMemoryOrderRepository`.

## אחסון ואספקת הספר הדיגיטלי (Supabase Storage)

שכבת האחסון של קובץ הספר בנויה כמודול **שרת בלבד** תחת
`src/lib/storage/` (`import "server-only"`). היא קוראת אך ורק את חמשת
משתני הסביבה `SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
`BOOK_STORAGE_BUCKET`, `BOOK_PDF_PATH`, `BOOK_DOWNLOAD_TTL_SECONDS`,
ומייצרת **קישור חתום זמני** לכל אספקה מורשית.

עקרונות אבטחה שנאכפים בקוד:

- **ה-bucket חייב להישאר פרטי.** משתמשים אך ורק ב-`createSignedUrl` -
  לעולם לא ב-`getPublicUrl`.
- **`SUPABASE_SECRET_KEY` הוא שרתי בלבד.** לעולם לא `NEXT_PUBLIC_`, ולעולם
  לא מיובא לתוך קומפוננטת client. ה-client מאותחל עם
  `persistSession=false` ו-`autoRefreshToken=false`.
- קישור חתום מונפק **אך ורק** כאשר סופק אובייקט הזמנה עם
  `paymentStatus === "paid"` (`issueBookDownloadUrl`). `pending` /
  `failed` / `cancelled` / חסר / לא ידוע נדחים. כתובת מייל בלבד אינה הרשאה.
- ה-TTL מוגבל ל-60–900 שניות (ברירת מחדל בטוחה 900). ערך חסר → 900;
  ערך לא חוקי או מעל 900 → כישלון סגור.
- הקישור נוצר טרי בכל אספקה, **אינו נשמר ב-DB ואינו מוחזק במטמון**.
  נתיב האובייקט הקבוע אינו נחשף לדפדפן.
- שגיאות מסווגות למטא-נתונים בטוחים בלבד (`diagnostics.ts`) - לעולם לא
  זולגים URL, מפתחות, שם bucket, נתיב, הודעת ספק או stack ללוגים או ללקוח.
- קובץ ה-PDF אינו נמצא ב-`/public`, ב-Git, ב-frontend bundle או ב-build output.

`verifyBookStorage()` היא בדיקת מוכנוּת שרתית פנימית (לא endpoint ציבורי)
שמחזירה בוליאנים בלבד ולעולם לא את הקישור החתום.

> **מוכנוּת אחסון אינה אומרת שהמכירה או ה-fulfillment מוכנים.** כל עוד
> `SALES_ENABLED=false` אין באתר כפתור הורדה ואין endpoint הורדה ציבורי.
> טרם קיימת נקודת הורדה ציבורית - יש להוסיפה רק כאשר יקיים מנגנון
> token חד-פעמי מאובטח קריפטוגרפית הקשור להזמנה משולמת מתמשכת.

פירוט מלא: ראו [`docs/BOOK_STORAGE.md`](docs/BOOK_STORAGE.md).

## אנליטיקה ועוגיות

- `src/lib/analytics.ts` - שכבת הפשטה לאירועי אנליטיקה
  (`trackEvent`). כל האירועים המרכזיים (`view_product`,
  `begin_checkout`, `purchase` וכו') כבר משולבים ברכיבים.
- `src/components/analytics/AnalyticsScripts.tsx` - טוען את סקריפטי
  GA / GTM / Meta Pixel **רק** אם המזהה המתאים הוגדר במשתני הסביבה
  **וגם** המשתמש אישר את קטגוריית העוגיות הרלוונטית
  (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`).
- `src/components/layout/CookieConsent.tsx` - באנר עוגיות עם שלוש
  קטגוריות (הכרחי / אנליטיקה / שיווק), ללא הפעלה אוטומטית של אף
  קטגוריה לא-הכרחית.

## מבנה הפרויקט

```
src/
  app/                עמודי App Router + API routes + קבצי SEO (sitemap, robots, manifest, OG)
  components/
    ui/               רכיבי בסיס נגישים (Button, Card, Accordion, Dialog...)
    layout/           Header, MobileMenu, Footer, StickyPurchaseBar, CookieConsent
    sections/         כל חלקי עמוד הבית
    purchase/         כרטיס רכישה ובחירת כמות
    checkout/          טופס Checkout, סיכום הזמנה
    forms/            טופס יצירת קשר, טופס דיוור
    schema/           רכיבי JSON-LD (Book, Product, FAQPage, Person, Breadcrumb)
    analytics/        טעינת סקריפטי אנליטיקה מותנית הסכמה
  config/             site.ts, nav.ts - מקור אמת יחיד לנתונים עסקיים
  content/            טקסטים ותוכן (ספר, מחבר, שאלות נפוצות, המלצות, משפטי)
  lib/
    orders/           מודל נתונים + מאגר הזמנות (abstraction)
    payments/         שכבת ספק סליקה (abstraction + Mock provider)
    validation/       סכמות Zod ל-checkout/contact/newsletter
    pricing.ts        חישוב סכום הזמנה - תמיד בצד השרת
    rateLimit.ts       הגבלת קצב לטפסים ול-API
    analytics.ts      trackEvent + ניהול הסכמת עוגיות
e2e/                  בדיקת Playwright למסלול רכישה מלא
```

## מה עדיין דורש תוכן אמיתי

לפני עלייה לאוויר בסביבת production אמיתית, יש להחליף:

- מחיר, עלות משלוח וזמן אספקה אמיתיים (`src/config/site.ts`).
- תמונות אמיתיות: כריכת הספר, הדמיית תלת-ממד, תמונת המחבר, חוברת העבודה.
- טקסט "על המחבר" אמיתי (`src/content/author.ts`) - כרגע placeholder בלבד.
- פרטי עסק (שם עוסק מורשה, כתובת) ב-`siteConfig.business` ובעמודי המדיניות (`src/content/legal.ts`) - רצוי גם עיון עורך/ת דין.
- פרטי קשר אמיתיים (`siteConfig.contact`).
- חיבור ספק סליקה אמיתי (ראו למעלה) - אחרת האתר יישאר במצב Demo בלבד.
- חיבור בסיס נתונים אמיתי (ראו למעלה) - אחרת הזמנות לא יישמרו לאורך זמן.
- חיבור ספק שליחת מייל אמיתי לטופס יצירת הקשר (`src/app/api/contact/route.ts` - כרגע רק רושם ליומן השרת).
- חיבור ספק דיוור אמיתי לטופס הרשמה (`src/lib/newsletter/provider.ts` - כרגע רק רושם ליומן השרת).
- המלצות קוראים אמיתיות, אם וכאשר יהיו (`src/content/testimonials.ts`).
