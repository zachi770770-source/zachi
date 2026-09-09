"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";

import type { HomePathId } from "@/content/homePaths";

const FocusMode = React.lazy(() =>
  import("@/components/focus/FocusMode").then((m) => ({ default: m.FocusMode })),
);

/**
 * הדלת ל„עובדה מול סיפור” בעמוד-המושג — **opt-in, ואחת בלבד**.
 *
 * קודם היו לרעיון הזה שתי מימושים נפרדים באתר: `FocusMode` בעמוד הבית
 * (במה כהה בת ארבעה שלבים), ו-`MethodFactStory` כאן (שבבים לבחירה: „מה קרה
 * בפועל?”). אותה הפרדה בדיוק, בשני ממשקים, בשני מקומות — וגם השני התחיל
 * בשאלה שמבקשת מהמבקר לסווג את עצמו. הראשון נשאר, מקוצר; השני הוסר.
 *
 * הכפתור כאן הוא קישור-פעולה שקט: כלל היררכיית-ה-CTA קובע שכלי לעולם אינו
 * הפעולה הראשית במסך. ההסבר המלא של המושג נמצא בעמוד עצמו וקריא בלי JS —
 * ההדגמה היא תוספת, לא תנאי.
 */
export function MethodFocusDemo({ situationId }: { situationId: HomePathId }) {
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <div className="method-demo-entry">
        <p className="method-demo-entry__line">
          רוצים לראות את ההפרדה הזו על דוגמה אחת מהספר?
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="method-demo-entry__button"
        >
          ראו את זה על דוגמה
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <React.Suspense
      fallback={
        <p className="py-10 text-center text-[15px] text-foreground-muted" role="status">
          טוען…
        </p>
      }
    >
      <FocusMode situationId={situationId} onClose={() => setOpen(false)} />
    </React.Suspense>
  );
}
