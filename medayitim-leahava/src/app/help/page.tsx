import type { Metadata } from "next";
import { PublicShell, LegalSection } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "קבלת עזרה מקצועית ובטיחותית — מדייטים לאהבה",
};

/*
 * SAFETY RESOURCES — approved by the product owner for embedding.
 *
 * Verified against official / authoritative sources (gov.il, eran.org.il,
 * 1202.org.il):
 *   - משטרה 100 · מד"א 101 · כבאות 102 (standard national emergency numbers)
 *   - משרד הרווחה מוקד 118 (gov.il)
 *   - ער"ן 1201 + WhatsApp 052-8451201 (eran.org.il)
 *   - איגוד מרכזי הסיוע 1202 (נשים) / 1203 (גברים), קו ערבית 04-6566813,
 *     גברים דתיים 02-5328000 (1202.org.il / kolzchut)
 *
 * Owner-provided, to re-verify against the official sites before public launch:
 *   - WhatsApp איגוד הסיוע 052-8361202
 *   - קו דתי/חרדי לנשים וילדים *2511
 *
 * Intentionally NOT embedded (source inconsistency / unverified):
 *   - 118 silent SMS/WhatsApp number → we link to the official Welfare site
 *     instead of showing a specific number.
 *   - the toll-free family-violence treatment line (unverified source).
 */

export default function HelpPage() {
  return (
    <PublicShell title="קבלת עזרה מקצועית ובטיחותית">
      {/* Calm safety banner */}
      <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-5">
        <p className="leading-relaxed text-amber-900">
          אם יש סכנה או פחד — האפליקציה אינה המקום להחליט לבד. כשיש אלימות,
          שליטה, איום, מעקב או כפייה, הצעד הבוגר הוא לפנות החוצה: לאדם קרוב
          שסומכים עליו, לאיש מקצוע, או לאחד ממוקדי הסיוע שכאן.
        </p>
      </div>

      <LegalSection heading="חירום מיידי">
        <p>אם אתם או מישהו אחר בסכנה מיידית, פנו עכשיו:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <span className="font-medium text-ink-900">משטרת ישראל — 100</span>{" "}
            — סכנה מיידית או אלימות פעילה.
          </li>
          <li>
            <span className="font-medium text-ink-900">מד״א — 101</span> — חירום
            רפואי.
          </li>
          <li>
            <span className="font-medium text-ink-900">כבאות והצלה — 102</span> —
            סכנת אש או חילוץ.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="אלימות במשפחה, שליטה, פחד או איום">
        <ul className="list-inside list-disc space-y-1">
          <li>
            <span className="font-medium text-ink-900">
              משרד הרווחה — מוקד 118
            </span>{" "}
            — מידע וסיוע, כולל מצבים של אלימות במשפחה.
          </li>
        </ul>
        <p className="text-sm text-ink-700">
          למידע על פנייה שקטה ב-SMS/WhatsApp, יש לבדוק באתר{" "}
          <a
            href="https://www.gov.il/he/departments/general/molsa-118"
            target="_blank"
            rel="noopener noreferrer"
            className="text-clay-600 underline hover:text-clay-700"
          >
            משרד הרווחה הרשמי
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="מצוקה רגשית">
        <ul className="list-inside list-disc space-y-1">
          <li>
            <span className="font-medium text-ink-900">
              ער״ן — עזרה ראשונה נפשית — 1201
            </span>{" "}
            — תמיכה נפשית מיידית ואנונימית, בכל שעה.
          </li>
          <li>
            <span className="font-medium text-ink-900">ער״ן ב-WhatsApp</span> —
            052-8451201.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="פגיעה מינית, כפייה או ניצול">
        <ul className="list-inside list-disc space-y-1">
          <li>
            <span className="font-medium text-ink-900">1202</span> — מענה על ידי
            נשים.
          </li>
          <li>
            <span className="font-medium text-ink-900">1203</span> — מענה על ידי
            גברים.
          </li>
          <li>
            <span className="font-medium text-ink-900">WhatsApp</span> —
            052-8361202.
          </li>
        </ul>
        <p className="text-sm text-ink-700">קווים ייעודיים נוספים:</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-ink-700">
          <li>04-6566813 — סיוע בערבית.</li>
          <li>*2511 — נשים, ילדות וילדים מהחברה הדתית והחרדית.</li>
          <li>02-5328000 — גברים ונערים מהחברה הדתית והחרדית.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="חשוב לזכור">
        <p>
          "מדייטים לאהבה" הוא כלי עזר אישי להתבוננות ובהירות. הוא אינו טיפול
          ואינו תחליף לפנייה לאדם קרוב, לאיש מקצוע או למוקד חירום. הוא לא נועד
          לעזור לכם להישאר במצב פוגעני — ובמצבים כאלה, הצעד הבוגר הוא לפנות
          לעזרה, לא להמשיך לבד.
        </p>
      </LegalSection>
    </PublicShell>
  );
}
