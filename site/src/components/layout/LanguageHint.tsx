"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { getStoredLanguage, storeLanguage, prefersEnglishOverHebrew } from "@/lib/language";

/**
 * רמיזה חד-פעמית לדוברי אנגלית שהגיעו לעמוד הבית העברי.
 *
 * **למה רמיזה ולא הפניה אוטומטית.** ההפניה המתבקשת — לנתב את „/” ל„/en” לפי
 * `Accept-Language` — היא בדיוק מה שעלול להרחיק את Googlebot מעמוד הבית
 * העברי: הזחלן שולח בדרך כלל `en-US` (או כלום), כלומר *הוא* היה מנותב משם.
 * עמוד הבית העברי הוא משטח-האינדוקס המרכזי של האתר, וכרגע גם זה שמצב
 * האינדוקס שלו עוד לא אומת. לכן: שתי הכתובות נשארות יציבות וישירות, אף אחת
 * אינה מפנה לשנייה, וההתאמה האוטומטית מסתכמת בשורה אחת שאפשר לסגור.
 * אין כאן ניתוב, אין הבדל בין זחלן למשתמש, ואין דרך להיתקע בלולאה.
 *
 * מופיעה רק כאשר *שני* התנאים מתקיימים: אין העדפה מפורשת שמורה, והדפדפן
 * מעדיף אנגלית על פני עברית. בחירה מפורשת — לכאן או לכאן — משתיקה אותה לתמיד.
 *
 * המימוש קורא מצב שקיים רק בדפדפן (localStorage + navigator), ולכן משתמש
 * ב-`useSyncExternalStore` עם snapshot-שרת קבוע `false`: השרת מרנדר כלום,
 * הלקוח מחליט אחרי ההידרציה, ואין אי-התאמת-הידרציה ואין setState באפקט.
 */

/** הרמיזה נקבעת פעם אחת לכל טעינת-עמוד; אין מקור חיצוני שמשתנה תוך כדי. */
const subscribe = () => () => {};

function eligibleSnapshot(): boolean {
  return getStoredLanguage() === null && prefersEnglishOverHebrew();
}

export function LanguageHint() {
  const eligible = React.useSyncExternalStore(
    subscribe,
    eligibleSnapshot,
    () => false, // בשרת: לעולם לא מרונדר
  );
  const [dismissed, setDismissed] = React.useState(false);

  if (!eligible || dismissed) return null;

  return (
    <div
      lang="en"
      dir="ltr"
      role="region"
      aria-label="Language suggestion"
      className="border-b border-border bg-surface-muted"
    >
      <div className="container-page flex items-center justify-between gap-3 py-2.5">
        <p className="text-[13px] leading-snug text-foreground-muted">
          This book is also available in English.{" "}
          <Link
            href="/en"
            hrefLang="en"
            onClick={() => storeLanguage("en")}
            className="font-semibold text-foreground underline underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Read in English
          </Link>
        </p>
        <button
          type="button"
          onClick={() => {
            // סגירה = בחירה מפורשת להישאר בעברית, ולכן לא נציע שוב.
            storeLanguage("he");
            setDismissed(true);
          }}
          aria-label="Dismiss and stay on the Hebrew site"
          className="shrink-0 rounded-md p-1.5 text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
