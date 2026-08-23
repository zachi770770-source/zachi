"use client";

import Link from "next/link";
import { Languages } from "lucide-react";

import { cn } from "@/lib/utils";
import { storeLanguage } from "@/lib/language";

/**
 * מחליף-שפה גלוי בין האתר העברי (/) לעמוד המהדורה האנגלית (/en).
 *
 * שלוש החלטות שחשובות כאן:
 *   1. **קישור, לא כפתור.** זהו ניווט לכתובת יציבה, ולכן `<Link>` — נגיש
 *      במקלדת מעצם היותו, ניתן לפתיחה בלשונית חדשה, וזחלן יכול לעקוב אחריו.
 *      זה גם מה שמייצר את הקישור הפנימי ההדדי בין שתי גרסאות השפה.
 *   2. **לא נראה כמו כפתור הרכישה.** ה-CTA לאמזון מלא וצבעוני; זה קישור-טקסט
 *      שקט עם מסגרת דקה, כדי ששתי הפעולות לא יתחרו זו בזו.
 *   3. **`lang`/`dir` על התווית עצמה.** „English” מסומן `lang="en"` בתוך עמוד
 *      עברי, ו„עברית” מסומן `lang="he" dir="rtl"` בתוך עמוד אנגלי, כדי
 *      שקורא-מסך יהגה כל תווית בשפה הנכונה שלה.
 *
 * הקליק שומר העדפה מפורשת. מרגע זה הרמיזה האוטומטית (`LanguageHint`) שותקת.
 */
export function LanguageSwitch({
  to,
  className,
  onNavigate,
}: {
  /** שפת *היעד* של המעבר. */
  to: "en" | "he";
  className?: string;
  /** נקרא אחרי שמירת ההעדפה — למשל לסגירת תפריט המובייל. */
  onNavigate?: () => void;
}) {
  const isToEnglish = to === "en";

  return (
    <Link
      href={isToEnglish ? "/en" : "/"}
      hrefLang={to}
      onClick={() => {
        storeLanguage(to);
        onNavigate?.();
      }}
      aria-label={isToEnglish ? "Switch to the English edition page" : "עבור לאתר בעברית"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5",
        "text-[13px] font-medium text-foreground-muted transition-colors",
        "hover:border-foreground/25 hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        className,
      )}
    >
      <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span lang={to} dir={isToEnglish ? "ltr" : "rtl"}>
        {isToEnglish ? "English" : "עברית"}
      </span>
    </Link>
  );
}
