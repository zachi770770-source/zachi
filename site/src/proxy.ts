import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * הפניות 301 קבועות לכתובות ישנות/חיצוניות אל העמוד הרלוונטי הקיים.
 * ב-Next 16 `middleware` הוחלף ב-`proxy`. הפניות ב-next.config מחזירות 308;
 * כאן אנחנו מחזירים 301 מדויק (כפי שנדרש) דרך NextResponse.redirect.
 *
 * מדיניות כתובות ישנות (מאומתת מול הריפו וההיסטוריה: אין באתר בלוג, אין sitemap
 * ישן עם מאמרים, ואין מיפוי לכתובות-מאמר בודדות — מעולם לא קיימו כעמודים):
 *
 *   /about      → /author  (301) — „אודות” → עמוד המחבר. סמנטי ומדויק.
 *   /articles   → /book    (301) — אינדקס-המאמרים הישן (סקשן שלם) → עמוד הספר,
 *                 התוכן המהותי הקרוב ביותר; אין באתר בלוג/עמוד-מאמרים חלופי.
 *   /articles/* → 410 Gone         — כתובות-מאמר בודדות מעולם לא קיימו ואין להן
 *                 תחליף-תוכן ספציפי. לא יוצרים 301 שרירותי לעמוד לא-רלוונטי;
 *                 410 מסמן במפורש „הוסר לצמיתות” (נקי יותר ל-SEO מ-soft-404).
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
      "410 Gone — הכתובת הזו הוסרה לצמיתות ואין לה עמוד חלופי.",
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
