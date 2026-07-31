"use client";

import { Compass } from "lucide-react";

import { compass } from "@/content/compass";
import { Button } from "@/components/ui/button";

/**
 * CTA „המצפן” בתוך ה-Hero — למובייל בלבד (md:hidden). בדסקטופ/טאבלט המשגר
 * הוא לשונית הצד הקבועה (CompassLauncher), ולכן כאן מסתתר. הלחיצה פותחת את
 * אותו drawer דרך אירוע חלון — בלי בועה תחתונה ובלי שכפול לוגיקה.
 */
export function CompassHeroCta() {
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="mt-4 w-full md:hidden"
      onClick={() => window.dispatchEvent(new CustomEvent("open-compass"))}
    >
      <Compass className="h-4 w-4" aria-hidden="true" />
      {compass.signature.cta}
    </Button>
  );
}
