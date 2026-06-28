import type { Metadata } from "next";
import { PublicShell, LegalSection } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "קבלת עזרה מקצועית ובטיחותית — מדייטים לאהבה",
};

/*
 * SAFETY RESOURCES — numbers to confirm before public launch.
 *
 * Confirmed general emergency numbers (Israel):
 *   - משטרה: 100
 *   - מד"א (חירום רפואי): 101
 *
 * TODO (owner to confirm exact numbers before launch — do NOT guess):
 *   - קו סיוע לנפגעות/נפגעי אלימות במשפחה
 *   - עזרה ראשונה נפשית / מצוקה רגשית
 *   - מרכזי סיוע לנפגעות/נפגעי תקיפה
 * Until confirmed, the page directs users to the general emergency lines and
 * to a trusted person / professional, and clearly marks the dedicated list as
 * "being finalised".
 */

export default function HelpPage() {
  return (
    <PublicShell title="קבלת עזרה מקצועית ובטיחותית">
      {/* Prominent safety banner */}
      <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-5">
        <p className="leading-relaxed text-amber-900">
          אם יש פחד, אלימות, שליטה, איום, מעקב, כפייה או סכנה — אל תשתמשו
          באפליקציה כדי להחליט לבד. זה הזמן לפנות החוצה: לאדם קרוב שסומכים עליו,
          לאיש מקצוע, למוקד סיוע, או לשירותי החירום.
        </p>
      </div>

      <LegalSection heading="במצב חירום מיידי">
        <p>אם אתם או מישהו אחר בסכנה מיידית, פנו עכשיו:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <span className="font-medium text-ink-900">משטרה:</span> 100
          </li>
          <li>
            <span className="font-medium text-ink-900">מד״א (חירום רפואי):</span>{" "}
            101
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="מוקדי סיוע ייעודיים">
        <p>
          רשימת מוקדי הסיוע הייעודיים (אלימות במשפחה, מצוקה רגשית, מרכזי סיוע)
          נמצאת בהשלמה ותתווסף כאן בקרוב. עד אז — אם אתם זקוקים לתמיכה שאינה
          מצב חירום מיידי, פנו לאיש מקצוע (פסיכולוג/ית, עובד/ת סוציאלי/ת) או
          לאדם קרוב שאתם סומכים עליו.
        </p>
      </LegalSection>

      <LegalSection heading="חשוב לזכור">
        <p>
          "מדייטים לאהבה" הוא כלי עזר אישי להתבוננות ובהירות, והוא אינו טיפול
          ואינו תחליף לעזרה מקצועית. הוא לא נועד לעזור לכם להישאר במצב פוגעני —
          ובמצבים כאלה, הצעד הבוגר הוא לפנות לעזרה, לא להמשיך לבד.
        </p>
      </LegalSection>
    </PublicShell>
  );
}
