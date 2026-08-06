import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * הפניות 301 קבועות לכתובות ישנות/חיצוניות אל העמוד הרלוונטי הקיים.
 * ב-Next 16 `middleware` הוחלף ב-`proxy`. הפניות ב-next.config מחזירות 308;
 * כאן אנחנו מחזירים 301 מדויק (כפי שנדרש) דרך NextResponse.redirect.
 *
 * שים לב: /about מפנה ל-/author (על המחבר) — הפניה סמנטית נכונה.
 * פרמטרי query (כגון UTM) נשמרים לצורך שיוך.
 *
 * כתובות /articles* אינן מטופלות כאן בכוונה: הן מעולם לא קיימו כעמוד באתר או
 * בהיסטוריית הפרויקט, ולכן הן מחזירות 404 טבעי. soft-404 (הפניה ל-/faq גנרי)
 * גרוע יותר ל-SEO מ-404 אמיתי.
 *
 * הערה: /book הוא כעת עמוד אמיתי (הספר לעומק), ולכן אינו מופיע כאן כהפניה.
 */
const REDIRECTS: Record<string, string> = {
  "/about": "/author",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // נרמול לוכסן סוגר, כדי ש-/about/ יטופל כמו /about.
  const key =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  const destination = REDIRECTS[key] ?? null;

  if (destination) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/about"],
};
