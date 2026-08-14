import type { FilterMap } from "@/content/methods";

/**
 * „מפת הסינון” של „קו אדום מול גמישות” — רגע של שיפוט עצמי קטן (לא חידון):
 * לכל דוגמה המבקר/ת מסמן/ת איך *הוא/היא* נוטה להתייחס אליה (קו אדום / גמישות),
 * ואז נחשפת נקודת-המבט של הספר + נימוק. אין ניקוד, אין „נכון/לא נכון”, אין ✓/✗ —
 * הבחירה שלכם ליד מה שהספר מציע, כדיאלוג. המטרה: „מה אני מתעקש/ת עליו, ומה אני
 * פוסל/ת מהר מדי?”, לא „צדקתי?”.
 *
 * ארכיטקטורה: רכיב שרת בלבד (ללא "use client"). כל פריט הוא radiogroup נטיבי;
 * הרפלקציה נחשפת דרך CSS ‏`:has(input:checked)` — עובד עם מקלדת, קורא-מסך וללא
 * JS, וכל נקודות-המבט והנימוקים קיימים ב-HTML (crawlable). מכבד reduced-motion.
 */
export function MethodFilterMap({ map }: { map: FilterMap }) {
  return (
    <section
      id="filter-map"
      aria-labelledby="fmap-heading"
      className="rounded-2xl border border-border bg-surface p-5 sm:p-7"
    >
      <span className="kicker">{map.eyebrow}</span>
      <h2 id="fmap-heading" className="mt-3 font-serif text-2xl font-semibold text-foreground">
        {map.title}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
        {map.intro}
      </p>

      <ul className="mt-5 grid list-none gap-3 p-0 sm:grid-cols-2">
        {map.items.map((it, i) => {
          const name = `fmap-${i}`;
          const bookLabel = it.side === "line" ? map.lineLabel : map.flexLabel;
          return (
            <li key={it.label}>
              <fieldset
                data-side={it.side}
                className="fmap-item rounded-xl border border-border bg-background p-4"
              >
                <legend className="fmap-q float-none text-[15px] font-semibold text-foreground">
                  {it.label}{" "}
                  <span className="font-normal text-foreground-muted">— אצלכם?</span>
                </legend>

                <div
                  role="radiogroup"
                  aria-label={`${it.label} — קו אדום או גמישות?`}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  {(["line", "flex"] as const).map((choice) => (
                    <label key={choice} className="fmap-chip">
                      <input type="radio" name={name} value={choice} className="sr-only" />
                      <span>{choice === "line" ? map.lineLabel : map.flexLabel}</span>
                    </label>
                  ))}
                </div>

                {/* נחשף אחרי הבחירה — נקודת-המבט של הספר (לא „תשובה נכונה”). */}
                <div className="fmap-reflect mt-3">
                  <span className="fmap-badge inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-bold">
                    בספר: {bookLabel}
                  </span>
                  <p className="mt-2 text-[14px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                    {it.reason}
                  </p>
                </div>
              </fieldset>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 font-serif text-[1.05rem] italic leading-relaxed text-foreground [text-wrap:pretty]">
        „{map.principle}”
      </p>
      <p className="mt-3 border-t border-border pt-4 text-[14px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
        {map.closing}
      </p>
    </section>
  );
}
