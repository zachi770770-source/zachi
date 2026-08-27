# מדייטים לאהבה — אתר טרום-השקה

> דייטינג הוא חיפוש. אהבה היא בנייה.

אתר שיווקי ממוקד-המרה לספר „מדייטים לאהבה” מאת צחי חן. בנוי ב-Next.js 16
(App Router), TypeScript (strict), Tailwind CSS 4 ו-RTL מלא בעברית.

**מודל הרכישה (V1):** הספר נמכר ב-**Amazon Kindle בלבד**. אין באתר checkout,
סליקה, הזמנות פנימיות או עגלה — כל קריאה לרכישה מפנה לאמזון (`AmazonBuyLink`),
והאתר אינו יודע אם קליק לאמזון הסתיים ברכישה.

> ⚠️ זו אינה גרסת ה-Next.js הסטנדרטית — יש לקרוא את `AGENTS.md` לפני כתיבת קוד.

---

## תוכן העניינים

1. [הרצה מקומית](#הרצה-מקומית)
2. [Build ובדיקות](#build-ובדיקות)
3. [פריסה ל-Vercel ומשתני סביבה](#פריסה-ל-vercel-ומשתני-סביבה)
4. [תת-מערכות V1](#תת-מערכות-v1)
5. [בסיס נתונים ומיגרציות](#בסיס-נתונים-ומיגרציות)
6. [אנליטיקה ועוגיות](#אנליטיקה-ועוגיות)
7. [עריכת תוכן](#עריכת-תוכן)
8. [מבנה הפרויקט](#מבנה-הפרויקט)
9. [מה עדיין דורש פעולה לפני השקה](#מה-עדיין-דורש-פעולה-לפני-השקה)

---

## הרצה מקומית

דרישות: Node.js 20.9+ ו-npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

האתר יעלה בכתובת [http://localhost:3000](http://localhost:3000). כל תת-המערכות
הדינמיות (Compass, ערכת הקורא, רשימת המתנה, יצירת קשר) נופלות בחן למצב מקומי/
מושבת כשמשתני הסביבה שלהן ריקים — האתר עולה ועובד גם בלי אף חיבור חיצוני.

## Build ובדיקות

```bash
npm run build       # build של Next.js (כולל בדיקת TypeScript)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run test         # בדיקות יחידה (Vitest)
npm run test:e2e     # Playwright (מריץ build+start אוטומטית לשני המשטחים)
```

כל הפקודות אמורות לעבור נקי לפני commit.

## פריסה ל-Vercel ומשתני סביבה

1. חברו את הריפו ב-Vercel עם **Root Directory** מוגדר לתיקיית `site`.
2. הגדירו את משתני הסביבה מתוך `.env.example` (Settings → Environment
   Variables). לכל הפחות `NEXT_PUBLIC_SITE_URL` לכתובת הפרודקשן.
3. Deploy — `next build` מזוהה אוטומטית.

`.env.example` הוא מקור האמת לשמות המשתנים (ערכים לעולם לא מקומיטים). האתר
מאנדקס (`index,follow`) רק כש-`VERCEL_ENV=production`; כל Preview מקבל
`noindex`.

## תת-מערכות V1

| תת-מערכת | מה היא עושה | הפעלה |
| --- | --- | --- |
| **רכישה** | קליק יוצא ל-Amazon Kindle (`AmazonBuyLink`) | תמיד פעיל (`siteConfig.amazon`) |
| **המצפן / „שאל את הספר”** | הכוונה אישית: מנוע מודרך דטרמיניסטי + שיחה חופשית אופציונלית (RAG סגור מעל תוכן הספר, `/api/compass`) | השיחה החופשית מגודרת ב-`COMPASS_ASSISTANT_ENABLED` + מפתח ספק + גרסת-ספר במסד; אחרת מוצג המצפן המודרך בלבד |
| **טעימה** | קורא-ספר עם קטע אמיתי, התאמת-כלי לפי הקשר (`/preview`) | תמיד פעיל |
| **ערכת הקורא (Reader Bonus)** | Amazon → `/reader` → העלאת הוכחת-רכישה → בדיקה ידנית → אישור/דחייה → מייל → גישה לערכה | `DATABASE_URL` + `READER_ADMIN_TOKEN` + Resend |
| **רשימת המתנה** | לכידת אימייל (`/api/waitlist`, מאגר Postgres) | `DATABASE_URL` |
| **יצירת קשר** | טופס → מייל דרך Resend (`/api/contact`) | `RESEND_API_KEY` + `CONTACT_FROM_EMAIL` + `CONTACT_TO_EMAIL` |
| **לוח בקרה** | אנליטיקה מוגנת ב-`/admin` (נתוני first-party אמיתיים + GA4 אופציונלי) | `READER_ADMIN_TOKEN` (+ `GA4_*` אופציונלי) |

## בסיס נתונים ומיגרציות

אחסון מתמיד ב-PostgreSQL דרך `DATABASE_URL` (משותף לרשימת המתנה, לערכת הקורא
ולנתוני השימוש של המצפן). המיגרציות הן מקור-האמת לסכימה ויושבות תחת:

- `src/lib/waitlist/migrations/`
- `src/lib/reader/migrations/`
- `src/lib/compass/migrations/`

יש להריץ אותן ידנית מול המסד לפני חיבור (ראו `.env.example`). בנוסף, קוד
ה-runtime מריץ `create table if not exists` אידמפוטנטי (self-heal) לפני
כתיבה — הגנה כפולה כל עוד אין runner מיגרציות אוטומטי בפריסה. אין `ALTER`/
`DROP` הרסני ב-runtime. לפיתוח/בדיקות בלבד קיימים `WAITLIST_ALLOW_MEMORY` /
`READER_ALLOW_MEMORY` (מתעלמים מהם ב-Vercel Preview/Production).

## אנליטיקה ועוגיות

- `src/lib/analytics.ts` — שכבת `trackEvent`. כל התעבורה/המעורבות/הקליקים
  זורמים ל-GA4/GTM; אין first-party event store. אירועי המפתח: משפך המצפן
  (`ask_*`, `compass_*`), טעימה (`preview_*`), קליק-רכישה לאמזון
  (`amazon_purchase_clicked`), רשימת המתנה (`waitlist_*`) וערכת הקורא
  (`reader_*`).
- `src/components/analytics/AnalyticsScripts.tsx` — טוען GA/GTM/Meta Pixel
  רק אם המזהה הוגדר **וגם** ניתנה הסכמת-עוגיות מתאימה.
- `src/components/layout/CookieConsent.tsx` — באנר שלוש-קטגוריות, ללא הפעלה
  אוטומטית של קטגוריה לא-הכרחית.

## עריכת תוכן

הנתונים וה-copy מרוכזים — אין לחפש טקסטים בתוך הרכיבים:

| קובץ | מה עורכים בו |
| --- | --- |
| `src/config/site.ts` | פרטי אמזון, מהדורה אנגלית, פרטי קשר/עסק, רשתות, תמונות, דגלי תכונות |
| `src/config/nav.ts` | קישורי ניווט בהדר ובפוטר |
| `src/content/book.ts` | Hero, הרעיון, השיטה, הכלים, הצצה לספר |
| `src/content/author.ts` | „על המחבר” |
| `src/content/faq.ts` | שאלות ותשובות (מקור אמת יחיד — UI + Schema) |
| `src/content/legal.ts` | תקנון, פרטיות, מדיניות מוצר |

תמונות: `public/images/**`, מקושרות דרך `siteConfig.images`. ה-OG image
והפאביקון נוצרים דינמית (`src/app/opengraph-image.tsx`, `icon.tsx`).

## מבנה הפרויקט

```
src/
  app/                עמודי App Router + API routes + קבצי SEO (sitemap, robots, manifest, OG)
    api/              compass, reader, waitlist, contact, admin
  components/
    ui/               רכיבי בסיס נגישים (Button, Dialog, Checkbox...)
    layout/           Header, MobileMenu, Footer, CookieConsent, SiteChrome
    sections/         חלקי עמוד הבית
    compass/          המצפן: מנוע מודרך + שיחה חופשית + משגר צף
    guidance/         מצב-תגובה משותף (Answer View)
    journey/          עמודי-מסע אישיים
    preview/          קורא הטעימה
    purchase/         AmazonBuyLink + כרטיס רכישה (אמזון)
    reader/           ערכת הקורא (Reader Bonus)
    waitlist/ forms/  רשימת המתנה, טופס יצירת קשר
    admin/            לוח הבקרה
    schema/           JSON-LD (Book, FAQPage, Person, Breadcrumb)
  config/             site.ts, nav.ts — מקור אמת יחיד
  content/            טקסטים ותוכן
  lib/
    compass/          RAG סגור + מגבלות + מיגרציות
    reader/ waitlist/ מאגרי Postgres + מיגרציות (memory fallback לבדיקות)
    admin/            auth + מטריקות + מתאם GA4
    email/            שליחת מייל דרך Resend
    validation/       סכמות Zod (compass, contact, waitlist, readerClaim)
    analytics.ts      trackEvent + הסכמת עוגיות
e2e/                  Playwright (משטח מודרך + משטח שיחה-חופשית)
```

## מה עדיין דורש פעולה לפני השקה

- **דומיין:** תיקון ה-DNS/רשם של `zachi.co.il` (כרגע NXDOMAIN ברמת הרשם).
- **פרטי עסק:** `siteConfig.business` (שם עוסק, כתובת) — כרגע `PLACEHOLDER`;
  עמודי המדיניות מציגים „גרסת מסגרת” עד שיוזנו ערכים אמיתיים (רצוי עיון עו״ד).
- **פרטי קשר:** `siteConfig.contact.email` אמיתי.
- **הפעלת מסד/שירותים בפרודקשן:** `DATABASE_URL` + הרצת המיגרציות,
  `READER_ADMIN_TOKEN`, ומשתני Resend — כדי לאפשר ערכת קורא, רשימת המתנה
  ויצירת קשר. שיחת המצפן החופשית דורשת בנוסף `COMPASS_ASSISTANT_ENABLED` +
  מפתח ספק + גרסת-ספר במסד.
- **פרטיות/AI:** אם השיחה החופשית מופעלת, היא שולחת טקסט חופשי לספק AI חיצוני
  (Anthropic) — יש לוודא שמדיניות הפרטיות משקפת עיבוד חיצוני זה.
- **נכסים:** ודאו שכל קובצי התמונה תחת `public/images` הם הנכסים הסופיים.
