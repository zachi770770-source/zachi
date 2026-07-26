import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * הפניות 301 קבועות לכתובות ישנות/חיצוניות אל העמוד הרלוונטי הקיים.
 * ב-Next 16 `middleware` הוחלף ב-`proxy`. הפניות ב-next.config מחזירות 308;
 * כאן אנחנו מחזירים 301 מדויק (כפי שנדרש) דרך NextResponse.redirect.
 *
 * שים לב: אף אחת מהכתובות האלה לא קיימה כעמוד באתר או בהיסטוריית הפרויקט,
 * ולכן אין תוכן ישן לשחזר — ההפניה מובילה לעמוד הרלוונטי ביותר:
 *   /book     → עמוד הבית (עמוד הספר הפעיל)
 *   /about    → /author (על המחבר)
 *   /articles → /faq (העמוד המידעי הקרוב ביותר; אין באתר בלוג/מאמרים)
 * פרמטרי query (כגון UTM) נשמרים לצורך שיוך.
 */
const REDIRECTS: Record<string, string> = {
  "/book": "/",
  "/about": "/author",
  "/articles": "/faq",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // נרמול לוכסן סוגר, כדי ש-/about/ יטופל כמו /about.
  const key =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  const destination =
    REDIRECTS[key] ?? (key.startsWith("/articles/") ? "/faq" : null);

  if (destination) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/book", "/about", "/articles", "/articles/:path*"],
};
