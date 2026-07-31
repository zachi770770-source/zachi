"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Compass, X } from "lucide-react";

import { compass } from "@/content/compass";
import { CompassConsole } from "@/components/compass/CompassConsole";

/**
 * משגר „המצפן” בעמוד הבית — הבידול המרכזי, נגיש תמיד וללא ניווט החוצה.
 *
 * - Desktop/Tablet (md ומעלה): לשונית צד קבועה באמצע גובה המסך (לא בתחתית).
 * - Mobile: מופעל דרך ה-CTA שבתוך ה-Hero (CompassHeroCta), ששולח את
 *   האירוע `open-compass`. אין כאן בועת צ׳אט תחתונה.
 *
 * הפתיחה מרנדרת את CompassConsole הקיים כמות שהוא — אותה קריאה ל-/api/compass,
 * אותה מכסה ואותו טיפול במצבים (ready/loading/answer/no-match/quota/error/soon).
 * אין כאן שכפול של API, לוגיקה, prompt או חיפוש; רק מעטפת תצוגה (drawer).
 */
export function CompassLauncher({
  salesOpen,
  maxQuestionChars,
}: {
  salesOpen: boolean;
  maxQuestionChars: number;
}) {
  const [open, setOpen] = React.useState(false);

  // ה-CTA שבתוך ה-Hero (מובייל) פותח את אותו drawer דרך אירוע חלון.
  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-compass", handler);
    return () => window.removeEventListener("open-compass", handler);
  }, []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {/* לשונית צד קבועה — טאבלט ומעלה בלבד, מעוגנת לאמצע הגובה */}
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="פתיחת המצפן"
          className="group fixed end-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-1.5 rounded-s-2xl border border-border-strong bg-foreground py-4 ps-2.5 pe-2.5 text-surface shadow-lg transition-[padding] hover:pe-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:flex"
        >
          <Compass className="h-5 w-5" aria-hidden="true" />
          <span className="text-[12px] font-semibold tracking-wide">המצפן</span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 end-0 z-50 flex w-[min(94vw,32rem)] flex-col overflow-hidden bg-background shadow-2xl focus:outline-none data-[state=open]:animate-fade-in"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-muted text-brand"
                aria-hidden="true"
              >
                <Compass className="h-4 w-4" />
              </span>
              <DialogPrimitive.Title className="font-serif text-lg font-semibold text-foreground">
                {compass.card.eyebrow}
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label="סגירת המצפן"
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
