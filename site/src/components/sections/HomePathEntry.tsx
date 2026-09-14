import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { homePaths, type HomePathKind } from "@/content/homePaths";

/**
 * חמש נקודות-הפתיחה של „איפה אתם נמצאים עכשיו?” — **ניווט, ולא הערכה עצמית**.
 *
 * מה היה כאן קודם ולמה זה ירד:
 *
 *   1. תיבה שנראתה כמו שדה-כתיבה („ספרו לי מה קורה אצלכם…”) ובפועל הייתה
 *      `<a href="/compass">`. היא הזמינה להקליד והובילה לשאלון. זה אפורדנס
 *      שקרי, והוא ירד — לא הוסתר מאחורי דגל.
 *   2. „זיהוי במקום”: לחיצה ראשונה בחרה, לחיצה שנייה פתחה את Focus Mode.
 *      עכשיו לחיצה אחת = מעבר לעמוד-המסע. זהו.
 *   3. כותרות-הקבוצה „המסלול / שלוש תחנות, לפי הסדר” ו„שערי מעבר / לא חלק
 *      מהמסלול”. זה מודל *פנימי* — שמות שאנחנו נתנו למבנה ב-`journeyFlow.ts` —
 *      והוא הופיע כאן ככותרת שהמבקר אמור ללמוד לפני שיבחר. מבקר שנוחת מגוגל
 *      לא צריך טקסונומיה כדי לומר „אני אחרי פרידה”. המודל עצמו לא השתנה
 *      במאום: אותן שלוש תחנות ואותם שני שערים, אותם יעדים, אותו סדר — רק
 *      ההסבר ירד, וההבחנה נשארת בשתי שורות מופרדות בקו-שיער אחד.
 *
 * המקטע הוא רכיב-שרת: אין state, אין rAF, אין מדידות, אין hydration. חמישה
 * `<a>` אמיתיים — עובדים ללא JS, נסרקים, ומהירים.
 */

function PathRow({ kind, offset }: { kind: HomePathKind; offset: number }) {
  const paths = homePaths.filter((p) => p.kind === kind);
  return (
    <ul className="path-row" data-kind={kind}>
      {paths.map((p, index) => (
        // `--i` רץ רציף על פני שתי השורות (0..4), כדי שהסטגר יקרא כרצף אחד של
        // חמש בחירות ולא כשתי קבוצות שמתחילות כל אחת מחדש.
        <li key={p.id} style={{ ["--i" as string]: String(offset + index) }}>
          <Link href={p.stationHref} className="situation-card">
            <span className="situation-card__title">
              {p.buttonTitle}
              <ArrowLeft className="situation-card__cue" aria-hidden="true" />
            </span>
            <span className="situation-card__sub">{p.buttonSub}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function HomePathEntry() {
  return (
    // חמש הבחירות נכנסו עד כה כגוש אחד: המעטפת נחשפה ב-fade-up יחיד, ולכן
    // חמישה מצבים שונים הופיעו באותו רגע. הסטגר הישן היה קשור למחלקת-הכרטיסים
    // שירדה יחד עם כרום-הכרטיס, ולא הוחלף. כאן הוא חוזר ברמת השורות עצמן.
    <div
      className="path-rows reveal mx-auto max-w-4xl"
      data-reveal="soft"
      data-stagger-group="nested"
    >
      <PathRow kind="station" offset={0} />
      <PathRow kind="gate" offset={3} />
    </div>
  );
}
