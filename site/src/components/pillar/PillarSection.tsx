import { cn } from "@/lib/utils";
import { SignatureMarkRule } from "@/components/pillar/PillarSignature";

/**
 * מקטע-תוכן בעמוד-אב, עם שני דברים שקובעים את קצב העמוד: **סמן** ו**גוון**.
 *
 * ── הסמן (`marker`) הוא ההבדל הקומפוזיציוני בין שני עמודי-האב ─────────────
 * שניהם אותו מותג ואותה טיפוגרפיה, אבל הם לא אמורים להיקרא כאותה תבנית עם
 * טקסט אחר:
 *
 *   • `"rule"` (/love) — קו טרקוטה קצר מעל הכותרת. לא ממוספר, לא מתקדם:
 *     „אהבה” אינה רשימת שלבים אלא כמה זוויות על אותו דבר, והקו הקצר מסמן
 *     התחלה חדשה בלי להבטיח סדר.
 *   • `"numeral"` (/dating) — מספר רץ לצד הכותרת. „דייטים” *כן* מתקדם, יש בו
 *     כיוון, והמספור הופך את רצף המקטעים למסלול שאפשר להתקדם בו.
 *
 * ── הגוון (`tone`) הוא הפיסוק ────────────────────────────────────────────
 * `"band"` מעביר את המקטע לכרית חמה (brand-muted) עם ריווח נדיב. משתמשים בו
 * במקטע אחד או שניים בעמוד, תמיד במקטע שיש בו מבנה (כרטיסים/השוואה), וכך
 * נוצר קצב: שקט → שקט → בלוק מובנה על רקע חם → שקט. בלי זה תשעה מקטעים
 * זהים נקראים כרצף אחד ארוך; עם זה יש לעמוד נשימה.
 *
 * אין כאן קווי-הפרדה בין כל שני מקטעים. הם היו הדבר שגרם לעמוד להיראות
 * כמחולק לפרוסות שוות — הסמן והריווח עושים את העבודה טוב יותר.
 */
export function PillarSection({
  id,
  heading,
  body,
  marker,
  index,
  tone = "plain",
  children,
  afterFirstParagraph,
  footer,
}: {
  id: string;
  heading: string;
  body: readonly string[];
  marker: "rule" | "numeral";
  /** מספר המקטע (1-based) — נדרש רק עבור `marker="numeral"`. */
  index?: number;
  tone?: "plain" | "band";
  /** מבנה אופציונלי (כרטיסים/השוואה) שנכנס אחרי הפסקאות. */
  children?: React.ReactNode;
  /**
   * תוכן שנכנס *בין* הפסקה הראשונה לשנייה, ולא אחרי כולן.
   *
   * נדרש כשהפסקה הראשונה נגמרת בנקודתיים ופותחת רשימה: הרשימה חייבת לשבת
   * צמוד למה שהכריז עליה, והפסקה שאחריה היא כבר המשך הטיעון. בלי זה הרשימה
   * הייתה נוחתת אחרי הפסקה השנייה, והנקודתיים היו מצביעות על כלום.
   */
  afterFirstParagraph?: React.ReactNode;
  /** קישור-העומק בסוף המקטע. */
  footer?: React.ReactNode;
}) {
  const band = tone === "band";
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full scroll-mt-24",
        // מקטע רגיל נשאר במידת-הקריאה. מקטע-כרית יוצא מעבר לה משני הצדדים:
        // זה מה שהופך אותו לרגע ולא לעוד פסקה עם רקע. שני הרוחבים ממורכזים
        // באותו מכל, ולכן עמוד-הטקסט נשאר על אותו ציר בשני המצבים.
        band
          ? "max-w-5xl rounded-3xl border border-brand/15 bg-brand-muted/30 px-5 py-10 sm:px-10 sm:py-14"
          : "max-w-3xl",
      )}
    >
      {/* בתוך כרית: הכותרת והפסקאות נשארות במידת-הקריאה (3xl) כדי שהטקסט לא
          „יימתח” ויתיישר אחרת מהמקטעים שסביבו. רק המבנה שמתחת מקבל את מלוא
          הרוחב. */}
      <div className={cn(band && "mx-auto max-w-3xl")}>
      {marker === "numeral" ? (
        <div className="flex items-baseline gap-3">
          <span
            aria-hidden="true"
            className="flex shrink-0 items-baseline gap-1.5 font-serif text-[0.95rem] font-semibold tabular-nums text-brand"
          >
            {String(index ?? 0).padStart(2, "0")}
            <span className="h-[4px] w-[4px] translate-y-[-3px] rounded-full bg-brand" />
          </span>
          <h2 className="type-section font-serif text-foreground">{heading}</h2>
        </div>
      ) : (
        <>
          <SignatureMarkRule />
          <h2 className="type-section mt-5 font-serif text-foreground">{heading}</h2>
        </>
      )}

      {body.map((p, i) => (
        <div key={p}>
          <p className="mt-5 max-w-[62ch] text-[1.06rem] leading-[1.9] text-foreground sm:text-[1.05rem] sm:leading-[1.85]">
            {p}
          </p>
          {i === 0 ? afterFirstParagraph : null}
        </div>
      ))}
      </div>

      {children}
      {/* קישור-העומק חוזר למידת-הקריאה גם בתוך כרית, כדי שיישב תחת הטקסט
          ולא תחת קצה הכרית. */}
      <div className={cn(band && "mx-auto max-w-3xl")}>{footer}</div>
    </section>
  );
}
