"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Compass, X } from "lucide-react";

import { compassQuiz } from "@/content/compass";
import { AskRoute } from "@/components/interactive/AskRoute";

/**
 * משגר „המצפן” בעמוד הבית — חוויית שלוש-השאלות הדטרמיניסטית, נגישה תמיד וללא
 * ניווט החוצה. אינו צ׳אטבוט ואינו AI: הבועה פותחת את אותו מנוע שאלון (PathFinder)
 * שבעמוד /compass ובבית — שלוש שאלות סגורות → תחנה + כלי + פעולה, בלי API חיצוני.
 *
 * - Desktop/Tablet (md ומעלה): בועה עגולה קבועה בצד המתחיל-לוגית של הקצה
 *   (שמאל ב-RTL), באמצע גובה המסך, עם תווית קטנה „המצפן”.
 * - Mobile: בועה עגולה צפה באותו צד, במרווח בטוח מעל באנר העוגיות, כדי שלא
 *   תסתיר אותו.
 * - הבועה נחשפת רק אחרי גלילה קלה, כדי שלא תתחרה בטופס ההרשמה שבשער בטעינה.
 */
export function CompassLauncher() {
  const [open, setOpen] = React.useState(false);
  const [bannerOpen, setBannerOpen] = React.useState(false);
  // גובה באנר-העוגיות (נמדד מריפוד-התחתית שה-CookieConsent שומר על ה-body) —
  // לצורך הרמת הגלולה *מעל* הבאנר עם מרווח ברור, במקום להסתירה.
  const [bannerHeight, setBannerHeight] = React.useState(0);
  // הבועה הצפה אינה מופיעה בפריים הראשון ממש (כדי לא לקפוץ מעל השער), אך נחשפת
  // מהר וברור בשני המכשירים: אחרי גלילה קטנה, או אחרי השהיה קצרה גם בלי גלילה —
  // כך מי שלא גולל עדיין רואה אותה, ולא רק אחרי חצי מסך.
  const [revealed, setRevealed] = React.useState(false);

  // ה-CTA שבתוך ה-Hero (מובייל) פותח את אותו drawer דרך אירוע חלון.
  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-compass", handler);
    return () => window.removeEventListener("open-compass", handler);
  }, []);

  // חשיפה מהירה: גלילה קלה (מעל 120px) *או* טיימר-גיבוי קצר, מה שקורה קודם.
  React.useEffect(() => {
    let timer = 0;
    const reveal = () => {
      setRevealed(true);
      cleanup();
    };
    const onScroll = () => {
      if (window.scrollY > 120) reveal();
    };
    const cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      if (timer) window.clearTimeout(timer);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // גיבוי: גם בלי גלילה כלל — הבועה נוכחת אחרי השהיה קצרה.
    timer = window.setTimeout(reveal, 1200);
    onScroll();
    return cleanup;
  }, []);

  // מצב באנר העוגיות מגיע כאות-מצב מפורש מ-CookieConsent (data-attribute על
  // ה-body + אירוע „cookie-banner-change”). כשהבאנר פתוח הגלולה *אינה* מוסתרת —
  // היא מורמת דינמית מעל הבאנר עם מרווח ברור (ראו bannerOffset למטה), ונשארת
  // גלויה ולחיצה למשתמש חדש. עם סגירת ההסכמה היא חוזרת חלק למיקום התחתון הרגיל.
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

  // גובה הבאנר נמדד מריפוד-התחתית שה-CookieConsent שומר על ה-body (אותו מנגנון
  // של בר-הטעימה) — מתאפס ל-0 עם סגירת הבאנר, ואז הגלולה חוזרת למיקומה הרגיל.
  React.useEffect(() => {
    const read = () => {
      const pb = parseInt(getComputedStyle(document.body).paddingBottom, 10);
      setBannerHeight(Number.isFinite(pb) ? pb : 0);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    window.addEventListener("resize", read);
    return () => {
      mo.disconnect();
      window.removeEventListener("resize", read);
    };
  }, []);

  // מובייל: הבועה מורמת מעל בר-הטעימה הדביק (הבר יושב בתחתית ורוחבו כמעט מלא),
  // כך שאין חפיפה בין שני הרכיבים הצפים. בדסקטופ היא בפינה התחתונה-מתחילה
  // (שמאל ב-RTL), הפוך מבר-הטעימה שיושב בפינה הנגדית.
  const mobileBottom = "max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))";

  // כשהבאנר פתוח — הרמה דינמית מעל גובהו עם מרווח ברור (16px, בטווח 12–20).
  // גובה הבאנר כולל כבר את ה-safe-area (הבאנר עצמו מרפד אותו). כשסגור → 0,
  // וה-max() בתחתית מחזיר את הגלולה למיקומה הרגיל. המעבר על „bottom” חלק.
  const BANNER_GAP = 16;
  const bannerOffset =
    bannerOpen && bannerHeight > 0 ? `${bannerHeight + BANNER_GAP}px` : "0px";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {/* בועה צפה גדולה עם טקסט מפורש — פינה תחתונה-מתחילה (שמאל ב-RTL) */}
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="שאל את הספר — 3–4 שאלות קצרות שמובילות אותך לתחנה ולכלי המתאימים"
          style={{
            ["--bubble-bottom" as string]: mobileBottom,
            ["--banner-offset" as string]: bannerOffset,
          }}
          className={
            // ה-bottom הוא max(בסיס-רספונסיבי, היסט-הבאנר): כשהבאנר סגור ההיסט 0
            // והבסיס קובע; כשפתוח ההיסט (גובה-הבאנר+מרווח) גדול מהבסיס ומרים את
            // הגלולה מעליו. המעבר על „bottom” חלק (בלי קפיצה/הבהוב). RTL: end-*.
            "group fixed end-4 bottom-[max(var(--bubble-bottom),var(--banner-offset))] top-auto z-40 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-4 text-[16px] font-bold leading-none text-surface shadow-xl ring-2 ring-brand transition-[opacity,transform,bottom] duration-500 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:end-6 md:bottom-[max(2rem,var(--banner-offset))] md:px-8 md:py-5 md:text-[18px]" +
            (revealed || open ? " opacity-100" : " opacity-0 pointer-events-none")
          }
        >
          {/* טקסט מפורש במקום אייקון — „שאל את הספר”. */}
          <span className="whitespace-nowrap">שאל את הספר</span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 end-0 z-50 flex w-[min(94vw,32rem)] flex-col overflow-hidden bg-background shadow-2xl focus:outline-none will-change-transform data-[state=open]:animate-compass-in data-[state=closed]:animate-compass-out"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-start gap-2.5">
              {/* אייקון מצפן קטן — מלווה בלבד, לא הכותרת הראשית. */}
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand"
                aria-hidden="true"
              >
                <Compass className="h-4 w-4" />
              </span>
              <div>
                <DialogPrimitive.Title className="font-serif text-lg font-semibold text-foreground">
                  {compassQuiz.ask.title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 max-w-[34ch] text-[13.5px] leading-snug text-foreground-muted">
                  {compassQuiz.ask.subtitle}
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label="סגירה"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="grow overflow-y-auto px-5 py-6 sm:px-6">
            <AskRoute />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
