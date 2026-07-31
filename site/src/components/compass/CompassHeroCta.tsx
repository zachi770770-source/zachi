"use client";

import { BookOpen } from "lucide-react";

import { compass } from "@/content/compass";
import { Button } from "@/components/ui/button";

/**
 * CTA „שאלו את הספר” בתוך ה-Hero — למובייל בלבד (md:hidden). בדסקטופ/טאבלט
 * המשגר הוא הבועה הצפה (CompassLauncher), ולכן כאן מסתתר. הלחיצה פותחת את
 * אותו drawer דרך אירוע חלון — בלי שכפול לוגיקה.
 *
 * וריאנט משני (outline, טוקנים קיימים) כדי שיהיה נמוך במפורש מ-CTA הטעימה
 * הראשי; אין צבע חדש ואין שינוי ברכיב Button.
 */
export function CompassHeroCta() {
  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      className="md:hidden"
      onClick={() => window.dispatchEvent(new CustomEvent("open-compass"))}
    >
      <BookOpen className="h-4 w-4" aria-hidden="true" />
      {compass.signature.cta}
    </Button>
  );
}
