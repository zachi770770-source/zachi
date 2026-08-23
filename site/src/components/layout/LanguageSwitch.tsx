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
  compact = false,
}: {
  /** שפת *היעד* של המעבר. */
  to: "en" | "he";
  className?: string;
  /** נקרא אחרי שמירת ההעדפה — למשל לסגירת תפריט המובייל. */
  onNavigate?: () => void;
  /**
   * גרסה צרה לשורת ההדר במובייל, שבה הפקד מתחרה על רוחב מול הלוגו, ה-CTA
   * וההמבורגר. התווית *נשארת מילה מלאה* („English” / „עברית”) — היא מה שהופך
   * את הפקד לגלוי ומובן; מה שמצטמצם הוא הסמל והריפוד בלבד.
   */
  compact?: boolean;
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
        "inline-flex shrink-0 items-center rounded-full border border-border",
        "font-medium text-foreground-muted transition-colors",
        "hover:border-foreground/25 hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        compact
          ? "h-11 gap-1 px-2 text-[12.5px]"
          : "gap-1.5 px-3 py-1.5 text-[13px]",
        className,
      )}
    >
      {compact ? null : <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <span lang={to} dir={isToEnglish ? "ltr" : "rtl"} className="whitespace-nowrap">
        {isToEnglish ? "English" : "עברית"}
      </span>
    </Link>
  );
}
