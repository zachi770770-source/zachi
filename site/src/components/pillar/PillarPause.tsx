import { SignatureMarkRule } from "@/components/pillar/PillarSignature";

/**
 * הפסקה אנושית באמצע עמוד ממוספר.
 *
 * ל-/dating יש מבנה מוצהר: 01–08, קשת-שלב, כרטיסים. זה נכון לעמוד מעשי, אבל
 * במינון גבוה הוא מתחיל להרגיש כמו מערכת ולא כמו מישהו שמדבר. הבלוק הזה הוא
 * הנשימה: משפט אחד, ללא מספר, ללא כותרת וללא קישור — דבר היחיד בעמוד שאינו
 * חלק מהרצף.
 *
 * הטקסט אינו חדש. זהו משפט שכבר היה בגוף המקטע שמעליו, והועלה לכאן כי הוא
 * נקודת-המפנה של העמוד כולו („החיפוש מתחלף בבנייה”), ובתוך פסקה רצה הוא נבלע.
 *
 * מרוסן בכוונה: ללא מרכאות מעוצבות, ללא רקע, ללא מסגרת. רק אוויר סביב משפט.
 */
export function PillarPause({ children }: { children: React.ReactNode }) {
  return (
    <figure className="mx-auto w-full max-w-3xl py-2 text-center">
      <SignatureMarkRule align="center" />
      <blockquote className="type-literary mx-auto mt-6 max-w-[22ch] text-[clamp(1.45rem,2.7vw,2rem)] font-medium leading-[1.35] text-foreground">
        {children}
      </blockquote>
    </figure>
  );
}
