import Link from "next/link";

import { homePaths, homePathUi, type HomePathKind } from "@/content/homePaths";

/**
 * חמש נקודות-הפתיחה של „איפה אתם נמצאים עכשיו?” — **ניווט, ולא הערכה עצמית**.
 *
 * מה היה כאן קודם ולמה זה ירד:
 *
 *   1. תיבה שנראתה כמו שדה-כתיבה („ספרו לי מה קורה אצלכם…”) ובפועל הייתה
 *      `<a href="/compass">`. היא הזמינה להקליד והובילה לשאלון. זה אפורדנס
 *      שקרי, והוא ירד — לא הוסתר מאחורי דגל.
 *   2. „זיהוי במקום”: לחיצה ראשונה בחרה, לחיצה שנייה פתחה את Focus Mode.
 *      כלומר שלושה צעדים ושישה פקדים גלויים לפני שהמבקר בכלל ראה את הספר.
 *      עכשיו לחיצה אחת = מעבר לעמוד-המסע. זהו.
 *   3. Focus Mode והשיחה (HomeConversation) — יצאו מהזרימה הראשית לגמרי.
 *      Focus Mode נכנס בבחירה מפורשת בלבד (ראו `DeeperEntry`).
 *
 * המקטע הוא עכשיו רכיב-שרת: אין state, אין rAF, אין מדידות, אין hydration.
 * חמישה `<a>` אמיתיים — עובדים ללא JS, נסרקים, ומהירים.
 *
 * המודל מוצג כפי שהוא באמת קיים ב-`journeyFlow.ts`: שלוש תחנות במחזור ושני
 * שערי-מעבר שאינם ממוספרים. מבקר שבחר כאן ונחת על „לפני קשר · מתחילים קשר ·
 * בתוך קשר” כבר ראה את אותו מודל — אין עוד סתירה בין „ארבעה כרטיסים” ל„תחנה
 * 3 מתוך 3”.
 */

function PathGroup({
  kind,
  label,
  hint,
}: {
  kind: HomePathKind;
  label: string;
  hint: string;
}) {
  const paths = homePaths.filter((p) => p.kind === kind);
  return (
    <div className="path-group">
      <div className="path-group__head">
        <h3 className="path-group__label">{label}</h3>
        <p className="path-group__hint">{hint}</p>
      </div>
      <ul className="path-group__list" data-kind={kind}>
        {paths.map((p, index) => (
          <li key={p.id}>
            <Link
              href={p.stationHref}
              style={{ ["--i" as string]: String(index) }}
              className="situation-card group flex h-full flex-col gap-1.5 rounded-2xl border border-border bg-surface p-4 text-start shadow-sm transition-[border-color,background-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-secondary/35 hover:bg-surface-muted/60 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0 sm:p-5"
            >
              <span className="font-serif text-[17px] font-semibold leading-snug text-foreground sm:text-[19px]">
                {p.buttonTitle}
              </span>
              <span className="text-[13.5px] leading-snug text-foreground-muted [text-wrap:pretty] sm:text-[14px]">
                {p.buttonSub}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HomePathEntry() {
  return (
    <div className="path-groups reveal mx-auto max-w-4xl">
      <PathGroup
        kind="station"
        label={homePathUi.stationsLabel}
        hint={homePathUi.stationsHint}
      />
      <PathGroup
        kind="gate"
        label={homePathUi.gatesLabel}
        hint={homePathUi.gatesHint}
      />
    </div>
  );
}
