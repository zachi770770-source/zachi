"use client";

import Link from "next/link";

import { trackEvent } from "@/lib/analytics";

/**
 * קישור פנימי נמדד — יורה `pillar_link_clicked { from, to }` בעת קליק.
 *
 * למה אירוע אחד ולא אירוע לכל מסלול: המסלולים שרצינו למדוד (עמוד-אב → מדריך,
 * עמוד-אב → /book, אינדקס → מאמר, ציר-המסע → תחנה) הם *אותה* פעולה מבחינת
 * הקורא, קליק מתוכן רוחבי אל התוכן שמתחתיו. שם-אירוע אחד עם שתי פרמטרים נותן
 * בדיוק את אותה חתכיות בלי לנפח את מודל-האירועים בשבעה שמות כמעט-זהים.
 *
 * `from` הוא מזהה העמוד המקורי ("love" / "dating" / "guide" / "journey"),
 * ו-`to` הוא הנתיב הפנימי. אין כאן PII, ולא נשלח דבר בלי הסכמת-עוגיות
 * (‎trackEvent‎ מטפל בכך). כשל באנליטיקה לעולם אינו חוסם ניווט.
 *
 * הקישור עצמו נשאר `<a>` אמיתי עם `href` — הזחלן רואה בדיוק את מה שראה קודם,
 * וה-JS נוסף על גביו בלבד.
 */
export function TrackedInternalLink({
  from,
  href,
  className,
  children,
}: {
  from: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        try {
          trackEvent("pillar_link_clicked", { from, to: href });
        } catch {
          /* לא-קריטי: מדידה לעולם לא מעכבת ניווט */
        }
      }}
    >
      {children}
    </Link>
  );
}
