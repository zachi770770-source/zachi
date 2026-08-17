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
 *   /articles/<slug> → 301 ייעודי — כאשר קיים עמוד חי עם תוכן שווה-ערך אמיתי
 *                 לכתובת-המאמר הישנה (אומת מול Google Search Console). המיפויים
 *                 הספציפיים ב-ARTICLE_REDIRECTS; הם נבדקים לפני מטפל ה-410 הכללי.
 *   /articles/* → 410 Gone         — ברירת-מחדל ל„נתיב ללא יעד ידוע”: כתובת-מאמר
 *                 שאין לה עמוד שווה-ערך אמיתי. בוחרים 410 (הוסר לצמיתות) ולא 301
 *                 שרירותי לעמוד לא-רלוונטי / לדף הבית. אם יימצא בעתיד מיפוי אמיתי
 *                 לכתובת ספציפית — יש להוסיפו ל-ARTICLE_REDIRECTS.
 *
 * פרמטרי query (כגון UTM) נשמרים בהפניות לצורך שיוך.
 */
const REDIRECTS: Record<string, string> = {
  "/about": "/author",
  "/articles": "/book",
};

/**
 * כתובות-מאמר בודדות מהאתר הישן (אומתו כ-404 ב-Google Search Console) שיש להן
 * עמוד חי עם תוכן שווה-ערך מובהק — מופנות ב-301 קבוע ליעד המדויק (לא לדף הבית):
 *   /articles/stop-auditioning-dates → /guide/finding-a-relationship
 *       המדריך „איך למצוא זוגיות בלי להפוך כל דייט למבחן” — סעיף „דייט אינו אודישן”.
 *   /articles/why-attracted-unavailable → /guide/attracted-to-unavailable
 *       המדריך „למה אני נמשך/ת לאנשים לא זמינים — ואיך יוצאים מהדפוס”.
 */
const ARTICLE_REDIRECTS: Record<string, string> = {
  "/articles/stop-auditioning-dates": "/guide/finding-a-relationship",
  "/articles/why-attracted-unavailable": "/guide/attracted-to-unavailable",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // נרמול לוכסן סוגר, כדי ש-/about/ יטופל כמו /about.
  const key =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  // כתובת-מאמר בודדת עם תחליף חי מובהק → 301 ייעודי ליעד המדויק.
  const articleDestination = ARTICLE_REDIRECTS[key] ?? null;
  if (articleDestination) {
    const url = request.nextUrl.clone();
    url.pathname = articleDestination;
    return NextResponse.redirect(url, 301);
  }

  // כתובת-מאמר בודדת אחרת (/articles/<slug>) — אין תחליף אמיתי → 410 Gone מפורש.
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
