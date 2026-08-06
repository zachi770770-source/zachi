import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * הפניות 301 קבועות לכתובות ישנות/חיצוניות אל העמוד הרלוונטי הקיים.
 * ב-Next 16 `middleware` הוחלף ב-`proxy`. הפניות ב-next.config מחזירות 308;
 * כאן אנחנו מחזירים 301 מדויק (כפי שנדרש) דרך NextResponse.redirect.
 *
 * הפניות סמנטיות (301):
 *   /about     → /author (על המחבר)
 *   /articles* → /book   (עמוד הספר — התוכן המהותי הקרוב ביותר לכל „מאמר”
 *                דייטינג/זוגיות ישן; לא הפניה ל-/faq גנרי, ולא soft-404 שרירותי).
 * פרמטרי query (כגון UTM) נשמרים לצורך שיוך.
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

  // כל תת-נתיב של /articles/* מופנה סמנטית לעמוד הספר.
  const destination =
    REDIRECTS[key] ?? (key.startsWith("/articles/") ? "/book" : null);

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
