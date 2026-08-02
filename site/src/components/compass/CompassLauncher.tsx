"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { BookOpen, X } from "lucide-react";

import { compass } from "@/content/compass";
import { CompassConsole } from "@/components/compass/CompassConsole";

/**
 * משגר „שאלו את הספר” בעמוד הבית — הבידול המרכזי, נגיש תמיד וללא ניווט החוצה.
 * (שם פנימי בקוד נשמר; זהו שם תצוגה בלבד.)
 *
 * - Desktop/Tablet (md ומעלה): בועה עגולה קבועה בצד המתחיל-לוגית של הקצה
 *   (שמאל ב-RTL), באמצע גובה המסך (לא בתחתית), עם תווית קטנה „שאלו את הספר”.
 * - Mobile: בועה עגולה צפה באותו צד, במרווח בטוח מעל באנר העוגיות (מחושב
 *   דינמית מה-padding שהבאנר שומר), כדי שלא תסתיר אותו. אין בועה תחתונה
 *   בסגנון צ׳אט שירות.
 * - הבועה נחשפת רק אחרי גלילה קלה, כדי שלא תתחרה בטופס ההרשמה שבשער בטעינה.
 *
 * הפתיחה מרנדרת את CompassConsole הקיים כמות שהוא — אותה קריאה ל-/api/compass,
 * אותה מכסה ואותו טיפול במצבים. אין שכפול של API, לוגיקה, prompt או חיפוש.
 */
export function CompassLauncher({
  salesOpen,
  maxQuestionChars,
}: {
  salesOpen: boolean;
  maxQuestionChars: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [bannerOpen, setBannerOpen] = React.useState(false);
  // הבועה הצפה אינה מופיעה בטעינה הראשונית כדי שלא תתחרה בטופס ההרשמה שבשער;
  // היא נחשפת בעדינות אחרי גלילה קלה (או מיד אם המשתמש כבר גלל / פתח את החלונית).
  const [revealed, setRevealed] = React.useState(false);

  // ה-CTA שבתוך ה-Hero (מובייל) פותח את אותו drawer דרך אירוע חלון.
  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-compass", handler);
    return () => window.removeEventListener("open-compass", handler);
  }, []);

  // חשיפה אחרי גלילה מעבר לכ-60% מגובה החלון (מעבר לאזור השער).
  React.useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.6) {
        setRevealed(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // מצב באנר העוגיות מגיע כאות-מצב מפורש מ-CookieConsent (data-attribute על
  // ה-body + אירוע „cookie-banner-change”), ולא מהסקה של ריווח CSS. במובייל
  // הבועה (בקרה לא-חיונית) מוסתרת כל עוד הבאנר פתוח, כדי שלא תכסה
  // טקסט/CTA/טופס, ומשוחזרת אוטומטית עם סגירת ההסכמה. הפתרון אינו מבוסס z-index.
  React.useEffect(() => {
    const readAttr = () =>
      document.body.getAttribute("data-cookie-banner") === "open";
    const sync = (nextOpen: boolean) => setBannerOpen(nextOpen);
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      sync(typeof detail?.open === "boolean" ? detail.open : readAttr());
    };
    // מצב התחלתי מהאות המפורש (data-attribute), למקרה שהאירוע כבר נורה.
    sync(readAttr());
    window.addEventListener("cookie-banner-change", onChange);
    return () => window.removeEventListener("cookie-banner-change", onChange);
  }, []);

  // כשאין באנר — הבועה מכבדת את env(safe-area-inset-bottom).
  const mobileBottom = "max(1.25rem, env(safe-area-inset-bottom))";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {/* בועה צפה — כל הרוחב מהצד המתחיל של הקצה (שמאל ב-RTL) */}
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="שאלו את הספר"
          style={{ ["--bubble-bottom" as string]: mobileBottom }}
          className={
            "group fixed end-4 bottom-[var(--bubble-bottom)] top-auto z-40 inline-flex translate-y-0 items-center gap-2.5 transition-opacity duration-500 focus-visible:outline-none md:end-5 md:bottom-auto md:top-1/2 md:-translate-y-1/2" +
            (bannerOpen ? " max-md:hidden" : "") +
            (revealed || open ? " opacity-100" : " opacity-0 pointer-events-none")
          }
        >
          {/* תווית קבועה, קטנה ועדינה — דסקטופ/טאבלט בלבד. לא לשונית ולא כפתור
              גדול; hover/focus רק מחזקים מעט את הניגודיות. */}
          <span className="hidden whitespace-nowrap rounded-full bg-surface px-3 py-1.5 text-[12.5px] font-medium text-foreground-muted shadow-sm ring-1 ring-border transition-colors group-hover:text-foreground group-focus-visible:text-foreground md:inline-block">
            שאלו את הספר
          </span>
          {/* בועה: גוף Ink + טבעת דקה Terracotta + אייקון ספר לבן; ללא pulse */}
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-surface shadow-lg ring-2 ring-brand group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 end-0 z-50 flex w-[min(94vw,32rem)] flex-col overflow-hidden bg-background shadow-2xl focus:outline-none will-change-transform data-[state=open]:animate-compass-in data-[state=closed]:animate-compass-out"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-muted text-brand"
                aria-hidden="true"
              >
                <BookOpen className="h-4 w-4" />
              </span>
              <DialogPrimitive.Title className="font-serif text-lg font-semibold text-foreground">
                {compass.card.eyebrow}
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label="סגירה"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="grow overflow-y-auto px-5 py-6 sm:px-6">
            <CompassConsole salesOpen={salesOpen} maxQuestionChars={maxQuestionChars} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
