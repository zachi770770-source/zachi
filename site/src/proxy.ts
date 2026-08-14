import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * הפניות 301 קבועות לכתובות ישנות/חיצוניות אל העמוד הרלוונטי הקיים.
 * ב-Next 16 `middleware` הוחלף ב-`proxy`. הפניות ב-next.config מחזירות 308;
 * כאן אנחנו מחזירים 301 מדויק (כפי שנדרש) דרך NextResponse.redirect.
 *
 * מדיניות כתובות ישנות:
 *   /about      → /author  (301) — „אודות” → עמוד המחבר. סמנטי ומדויק.
 *   /articles   → /book    (301) — אינדקס-מאמרים ישן (סקשן שלם) → עמוד הספר,
 *                 התוכן המהותי הקרוב ביותר; אין באתר בלוג/עמוד-מאמרים חלופי.
 *   /articles/* → 410 Gone         — החלטה *הנדסית* ל„נתיב ללא יעד ידוע”: אין
 *                 בריפו/בהיסטוריה כתובות-מאמר בודדות או מיפוי אליהן. איננו
 *                 קובעים שהן „מעולם לא התקיימו” — לא נבדקו מקורות חיצוניים
 *                 (Search Console, analytics/access-logs, sitemap חיצוני ישן,
 *                 backlinks). בהיעדר יעד סמנטי אמיתי בוחרים 410 (הוסר לצמיתות)
 *                 במקום 301 שרירותי לעמוד לא-רלוונטי. אם יימצא בעתיד מיפוי אמיתי
 *                 לכתובת ספציפית — יש להוסיפו כאן כ-301 ייעודי.
 *
 * פרמטרי query (כגון UTM) נשמרים בהפניות לצורך שיוך.
 */
const REDIRECTS: Record<string, string> = {
  "/about": "/author",
  "/articles": "/book",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // נרמול לוכסן סוגר, כדי ש-/about/ יטופל כמו /about.
  const key =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  // כתובת-מאמר בודדת (/articles/<slug>) — אין תחליף אמיתי → 410 Gone מפורש.
  if (key.startsWith("/articles/")) {
    return new NextResponse(
      "410 Gone: הכתובת הזו הוסרה לצמיתות ואין לה עמוד חלופי.",
      { status: 410, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const destination = REDIRECTS[key] ?? null;
  if (destination) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/about", "/articles", "/articles/:path*"],
};
