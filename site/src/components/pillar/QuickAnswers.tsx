import { SignatureMarkRule } from "@/components/pillar/PillarSignature";

/**
 * „בקצרה” — שאלות-הליבה של העמוד, כרגע טיפוגרפי גדול על מסלול.
 *
 * ── מה היה, ולמה זה לא החזיק ─────────────────────────────────────────────
 * הבלוק היה רשת של שתי עמודות: שאלה בסריף 1.1rem, ומתחתיה תשובה אפורה.
 * בדיוק אותו זוג בדיוק באותם גדלים הופיע שוב 6,000 פיקסלים אחר כך, ב„שאלות
 * שחוזרות”. כלומר העמוד חזר על *המרקם של עצמו*: כמעט שלושה מסכים שלמים של
 * „כותרת מודגשת + פסקה אפורה”, פעמיים, במרחק גלילה אחד זה מזה. זה מה שגורם
 * לעמוד להיקרא כמאמר מעוצב היטב ולא כחוויה.
 *
 * ── מה קורה כאן עכשיו ────────────────────────────────────────────────────
 * היררכיה הפוכה: כאן **השאלה** היא הרגע הטיפוגרפי. היא נקבעת בסריף גדול
 * (עד 1.75rem), והתשובה יושבת מתחתיה קטנה וצרה. ב„שאלות שחוזרות” ההיררכיה
 * הפוכה בדיוק — שם השאלה קטנה והתשובה נושאת. שני הבלוקים עדיין עונים על
 * שאלות, אבל אי-אפשר לבלבל ביניהם במבט אחד.
 *
 * ── המסלול ───────────────────────────────────────────────────────────────
 * קו דק רץ לאורך שולי הבלוק, ולכל שאלה יש נקודה עליו. זו אותה שפה של
 * „החצייה” בהירו, בקנה-מידה של פסקה: השאלות אינן רשימה אלא עצירות על מסלול
 * אחד. ולכן גם ההבדל בין שני העמודים אינו קישוט:
 *
 *   • `"seeking"` (/dating) — הקו מקוטע. החיפוש נמשך, עוד לא נוצר רצף.
 *   • `"settled"` (/love)   — הקו רציף. המסלול כבר מחובר.
 *
 * ── מובייל ───────────────────────────────────────────────────────────────
 * אינו הדסקטופ מוערם: השאלה נשארת גדולה (1.3rem ומעלה), הרווח בין פריטים
 * גדל ל-2.25rem, והמסלול נשאר בשוליים. הקריאה מתחלפת גדול → קטן → אוויר,
 * במקום מדרון אחיד של פסקאות.
 */
export function QuickAnswers({
  title,
  items,
  tone = "settled",
}: {
  title: string;
  items: readonly { readonly q: string; readonly a: string }[];
  /** `"seeking"` = /dating (מסלול מקוטע), `"settled"` = /love (מסלול רציף). */
  tone?: "seeking" | "settled";
}) {
  const seeking = tone === "seeking";
  return (
    <section
      aria-labelledby="quick-answers-heading"
      className="mx-auto w-full max-w-5xl border-t border-border pt-9 sm:pt-11"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,13rem)_1fr] lg:gap-14">
        <div>
          <SignatureMarkRule />
          <h2
            id="quick-answers-heading"
            className="mt-4 text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover"
          >
            {title}
          </h2>
        </div>

        {/* המסלול והשאלות. ה-`dl` הוא ה-containing block של הקו ושל הנקודות,
            ולכן שתיהן נמדדות מאותו קצה ונשארות מיושרות בכל רוחב וב-RTL. */}
        {/* מרחק אחד בין הקו לטקסט בכל רוחב (`--rail`), כדי שהנקודה תשב על הקו
            במדויק בלי לתחזק שני מספרים שצריכים להסכים ביניהם. */}
        <dl className="relative" style={{ ["--rail" as string]: "1.5rem", paddingInlineStart: "var(--rail)" }}>
          <span
            aria-hidden="true"
            className="absolute inset-y-[0.7rem] start-0 w-px"
            style={
              seeking
                ? {
                    // מקוטע: 7px קו, 7px רווח. „עוד לא נוצר רצף.”
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, color-mix(in srgb, var(--color-sage-ink) 55%, transparent) 0 7px, transparent 7px 14px)",
                  }
                : {
                    backgroundColor:
                      "color-mix(in srgb, var(--color-sage-ink) 42%, transparent)",
                  }
            }
          />
          {items.map((item, i) => (
            <div key={item.q} className={i === 0 ? "" : "mt-9 sm:mt-11"}>
              <dt className="type-literary relative text-[clamp(1.3rem,2.5vw,1.72rem)] font-medium leading-[1.34] text-foreground [text-wrap:balance]">
                {/* הנקודה שעל המסלול — אותה נקודה של החתימה, בגודל של תו. */}
                <span
                  aria-hidden="true"
                  className="absolute top-[0.62em] h-[7px] w-[7px] rounded-full bg-brand"
                  style={{
                    // חצי-רוחב הנקודה (3.5px) מוסט החוצה, כדי שהיא תשב *על*
                    // הקו ולא תישק לו מבפנים.
                    insetInlineStart: "calc(var(--rail) * -1 - 3.5px)",
                    marginTop: "-3.5px",
                  }}
                />
                {item.q}
              </dt>
              <dd className="mt-3 max-w-[52ch] text-[0.99rem] leading-[1.85] text-ink-soft">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
