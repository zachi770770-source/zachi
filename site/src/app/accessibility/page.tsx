import Link from "next/link";

import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/Container";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata = pageMetadata({
  title: "הצהרת נגישות",
  description: `הצהרת הנגישות של אתר ${siteConfig.bookTitle} — ההתאמות שבוצעו וכיצד לפנות אלינו.`,
  path: "/accessibility",
});

/** ההתאמות המפורטות כאן מיושמות בפועל באתר. אין לרשום כאן התאמה שלא בוצעה. */
const adaptations = [
  "האתר בנוי בעברית עם תמיכת RTL מלאה בכל העמודים.",
  "מבנה HTML סמנטי עם landmarks (header, nav, main, footer) וכותרות מדורגות.",
  "ניווט מלא במקלדת, עם חיווי פוקוס נראה לעין בכל הקישורים, הכפתורים ושדות הטופס.",
  'קישור "דילוג לתוכן" בתחילת כל עמוד למעבר מהיר אל התוכן המרכזי.',
  "לכל שדות הטפסים יש תוויות מקושרות; הודעות שגיאה והצלחה מוקראות לקוראי מסך (aria-live / role).",
  "טקסט חלופי (alt) לתמונות התוכן.",
  "התאמת ניגודיות צבעים לקריאוּת גם בגופן ובכפתורים.",
  "כיבוד העדפת המערכת להפחתת תנועה (prefers-reduced-motion) — האנימציות מצטמצמות אוטומטית.",
  "ניהול עוגיות מבוסס-הסכמה, ללא הפעלת עוגיות לא-הכרחיות ללא אישור המשתמש.",
];

export default function AccessibilityPage() {
  return (
    <Container className="py-10 sm:py-16">
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "הצהרת נגישות", path: "/accessibility" },
        ]}
      />
      <div className="prose-book mx-auto">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          הצהרת נגישות
        </h1>
        <p className="mt-4 text-base leading-relaxed text-foreground-muted">
          אנו רואים חשיבות רבה בכך שהאתר יהיה נגיש וזמין לכל אדם, לרבות אנשים עם
          מוגבלות, ופועלים לשיפור הנגישות באופן מתמשך. להלן ההתאמות שכבר יושמו
          באתר בפועל.
        </p>

        <h2 className="mt-8 font-serif text-xl font-semibold">
          התאמות שבוצעו
        </h2>
        <ul className="mt-3 flex flex-col gap-2.5">
          {adaptations.map((item) => (
            <li
              key={item}
              className="flex gap-3 text-base leading-relaxed text-foreground-muted"
            >
              <span aria-hidden="true" className="mt-1 text-brand">
                •
              </span>
              {item}
            </li>
          ))}
        </ul>

        <h2 className="mt-8 font-serif text-xl font-semibold">
          נתקלתם בבעיית נגישות?
        </h2>
        <p className="mt-3 text-base leading-relaxed text-foreground-muted">
          אם נתקלתם בקושי בגלישה או בתוכן שאינו נגיש עבורכם, נשמח שתעדכנו אותנו
          דרך{" "}
          <Link
            href="/contact"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            טופס יצירת הקשר
          </Link>
          , ונטפל בכך בהקדם.
        </p>
      </div>
    </Container>
  );
}
