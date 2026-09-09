import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { compassEntry } from "@/content/compass";

/**
 * הדלת היחידה אל השכבה העמוקה (המצפן).
 *
 * לפני כן היו לכלי הזה כעשר נקודות-כניסה — תיבה מזויפת בבית, כרטיסי-מצב,
 * Focus Mode, פריט בתפריט הראשי, בועה צפה בכל עמוד, קישור ב-/book, קישור
 * ב-/preview, שאלון בעמודי-המסע ועוד. כולן נסגרו. נשארה דלת אחת, מסומנת,
 * שהמבקר בוחר להיכנס אליה — והיא מנוסחת כמו מה שהיא באמת: עזרה למצוא **איפה
 * להתחיל לקרוא**, לא אבחון של הקשר.
 *
 * ויזואלית זו רצועה שקטה: קישור-טקסט, לא כפתור מלא. כלל היררכיית-ה-CTA קובע
 * שכלי לעולם אינו הפעולה הראשית במסך — ולכן הוא לעולם אינו נראה כמוה.
 */
export function DeeperEntry({ className }: { className?: string }) {
  return (
    <div className={`deeper-entry${className ? ` ${className}` : ""}`}>
      <p className="deeper-entry__line">{compassEntry.prompt}</p>
      <Link href="/compass" className="deeper-entry__link">
        {compassEntry.label}
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
