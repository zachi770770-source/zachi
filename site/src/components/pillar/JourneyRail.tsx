import Link from "next/link";

/**
 * „לפי איפה אתם עכשיו” — התחנות כעצירות על מסלול, לא כרשת כרטיסים.
 *
 * ── מה היה ───────────────────────────────────────────────────────────────
 * חמישה מלבנים מעוגלים זהים, כל אחד עם מסגרת, רקע, ריפוד וחץ קטן בפינה.
 * במובייל הם נערמים לטור של חמש תיבות שוות לגמרי — כלומר בדיוק „רשת
 * כרטיסים גנרית”, ובדיוק במקום שבו העמוד אמור להרגיש כמו סוף מסע: הרגע
 * האחרון לפני הסגירה. זה נקרא כתפריט, לא כהמשך.
 *
 * ── מה יש כאן ────────────────────────────────────────────────────────────
 * קו אחד רץ לאורך הבלוק, ולכל תחנה יש נקודה עליו. אין תיבות, אין מסגרות,
 * ואין רקע: רק המסלול, הנקודות, והשמות. זו אותה שפה של „החצייה” בהירו ושל
 * „בקצרה”, וכאן היא במשמעות המילולית ביותר שלה — אלה באמת תחנות על דרך.
 *
 * ── שני מצבים ────────────────────────────────────────────────────────────
 *   • `"seeking"` (/dating) — הנקודות חלולות (טבעת, לא עיגול מלא), והקו
 *     ממשיך מעבר לתחנה האחרונה ונמוג. עוד לא הגיעו; החיפוש נמשך.
 *   • `"settled"` (/love) — הנקודות מלאות, והקו נעצר בנקודה האחרונה. הגיעו.
 *
 * ── מימוש ────────────────────────────────────────────────────────────────
 * כל פריט מצייר את *קטע הקו שלו*, ולכן הקטעים מצטרפים לקו אחד רציף בלי
 * שאף אלמנט יצטרך לדעת את גובה הרשימה. הפריט הראשון מתחיל בנקודה, והאחרון
 * נגמר בה (או ממשיך, ב-`seeking`). הכול CSS סטטי: בלי JS, בלי מדידה, בלי
 * CLS. ה-`--rail` היחיד שומר על הקו ועל הנקודות מיושרים בכל רוחב וב-RTL.
 *
 * הקישורים עצמם לא נגעו: אותם `href`, אותן תוויות, אותו מספר — רק הקופסה
 * שסביבם ירדה. שטח-הלחיצה נשאר גבוה מ-44px בזכות הריפוד האנכי.
 */
export function JourneyRail({
  items,
  tone,
}: {
  items: readonly { readonly href: string; readonly label: string }[];
  /** `"seeking"` = /dating (נקודות חלולות, הקו ממשיך), `"settled"` = /love. */
  tone: "seeking" | "settled";
}) {
  const seeking = tone === "seeking";
  const railColor = "color-mix(in srgb, var(--color-sage-ink) 45%, transparent)";
  return (
    <ul
      className="mt-9 list-none ps-0 sm:mt-11"
      style={{ ["--rail" as string]: "1.75rem", ["--node" as string]: "1.61rem" }}
    >
      {items.map((item, i) => {
        const first = i === 0;
        const last = i === items.length - 1;
        return (
          <li key={item.href} className="relative">
            {/* קטע-הקו של הפריט. מתחיל בגובה הנקודה בפריט הראשון, ונגמר בה
                בפריט האחרון — אלא אם המסלול ממשיך (`seeking`). */}
            <span
              aria-hidden="true"
              className="absolute w-px"
              style={{
                insetInlineStart: "calc(var(--rail) - 0.5px)",
                top: first ? "var(--node)" : 0,
                bottom: last && !seeking ? "calc(100% - var(--node))" : 0,
                background: railColor,
              }}
            />
            {/* ב-`seeking` הקו יוצא מעבר לתחנה האחרונה ונמוג — „ממשיכים”. */}
            {last && seeking ? (
              <span
                aria-hidden="true"
                className="absolute h-10 w-px"
                style={{
                  insetInlineStart: "calc(var(--rail) - 0.5px)",
                  top: "100%",
                  background: `linear-gradient(to bottom, ${railColor}, transparent)`,
                }}
              />
            ) : null}

            <Link
              href={item.href}
              className="group flex items-start py-3.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              style={{ paddingInlineStart: "calc(var(--rail) + 1.1rem)" }}
            >
              {/* הנקודה שעל המסלול. מלאה = הגיעו; טבעת = עוד בדרך. */}
              <span
                aria-hidden="true"
                className="absolute h-[11px] w-[11px] rounded-full transition-transform duration-200 ease-out group-hover:scale-125 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                style={{
                  insetInlineStart: "calc(var(--rail) - 5.5px)",
                  top: "calc(var(--node) - 5.5px)",
                  background: seeking ? "var(--color-background)" : "var(--color-brand)",
                  boxShadow: seeking ? "inset 0 0 0 1.75px var(--color-brand)" : "none",
                }}
              />
              <span className="font-serif text-[1.08rem] font-semibold leading-[1.45] text-foreground underline-offset-[6px] transition-colors duration-200 group-hover:text-brand-hover group-hover:underline motion-reduce:transition-none sm:text-[1.12rem]">
                {item.label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
