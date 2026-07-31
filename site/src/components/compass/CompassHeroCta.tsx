"use client";

import { BookOpen } from "lucide-react";

import { compass } from "@/content/compass";
import { Button } from "@/components/ui/button";

/**
 * CTA „המצפן” בתוך ה-Hero — למובייל בלבד (md:hidden). בדסקטופ/טאבלט המשגר
 * הוא לשונית הצד הקבועה (CompassLauncher), ולכן כאן מסתתר. הלחיצה פותחת את
 * אותו drawer דרך אירוע חלון — בלי בועה תחתונה ובלי שכפול לוגיקה.
 *
 * גוף הכפתור = Ink (variant primary הקיים), בדיוק כמו שאר הכפתורים הראשיים
 * באתר. אין צבע חדש ואין שינוי ברכיב Button.
 */
export function CompassHeroCta() {
  return (
    <Button
      type="button"
      variant="primary"
      size="lg"
      className="mt-4 w-full md:hidden"
      onClick={() => window.dispatchEvent(new CustomEvent("open-compass"))}
    >
      <BookOpen className="h-4 w-4" aria-hidden="true" />
      {compass.signature.cta}
    </Button>
  );
}
