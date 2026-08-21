import { Container } from "@/components/shared/Container";
import { whyTheBook } from "@/content/homeStory";

/**
 * התשובה לשאלה המסחרית שהעמוד לא ענה עליה: אם באתר יש מדריכים, כלים,
 * עמודי-מסע ו„שאל את הספר” — למה בכלל לקנות ספר?
 *
 * התשובה לא מתגוננת ולא מקטינה את האתר. היא מציגה הבדל אמיתי במבנה, ועושה זאת
 * דרך *הצורה* ולא רק דרך הטקסט: האתר הוא שורה אחת, הספר הוא רצף ממוספר. שתי
 * הגרסאות הקודמות של המקטע (שתי כרטיסיות סימטריות, ואחריה משפט-סגירה שחזר על
 * הכותרת) תיארו את ההבדל במילים בזמן שהפריסה עצמה טענה שהשניים שווים.
 *
 * הרשימה של „בספר” היא תוכן-העניינים המאושר — לא הבטחה ולא רשימת פיצ׳רים. היא
 * המקום היחיד בעמוד שמראה מה יש *בתוך* הספר, ולכן היא נשארת במלואה.
 */
export function WhyTheBook() {
  return (
    <section aria-labelledby="why-book-heading" className="py-6 sm:py-10">
      <Container>
        <div className="reveal mx-auto max-w-3xl text-center">
          <span className="kicker justify-center">{whyTheBook.eyebrow}</span>
          <h2 id="why-book-heading" className="type-h2 mt-3 [text-wrap:balance]">
            {whyTheBook.title}
          </h2>
        </div>

        {/* אותו רוחב כמו הכותרת: פאנל צר מתחת לכותרת של 64px נראה ככותרת
            שמחפשת את התוכן שלה, ובנוסף דוחף את שורת-האתר לשתי שורות. */}
        <div className="reveal mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface sm:mt-8">
          {/* האתר — שורה אחת, שקטה, על רקע מוטעם: נקודת כניסה, לא יעד. */}
          <div className="flex flex-col gap-1.5 bg-surface-muted/60 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-5 sm:px-7 sm:py-5">
            <p className="shrink-0 text-[13px] font-semibold uppercase tracking-wide text-foreground-muted">
              {whyTheBook.site.label}
            </p>
            <p className="text-[15px] leading-relaxed text-foreground [text-wrap:pretty]">
              {whyTheBook.site.line}
            </p>
          </div>

          {/* הספר — הצד שאליו מובילים: רצף ממוספר, לא רשימה. */}
          <div className="border-t-2 border-brand/40 px-5 py-5 sm:px-7 sm:py-6">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
              {whyTheBook.book.label}
            </p>
            <ol className="mt-3 flex flex-col gap-2.5 sm:mt-4">
              {whyTheBook.book.lines.map((line, i) => (
                <li
                  key={line}
                  className="flex gap-3 text-[15px] leading-relaxed text-foreground [text-wrap:pretty] sm:text-[16px]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground"
                  >
                    {i + 1}
                  </span>
                  {line}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[13.5px] leading-snug text-foreground-muted">
              {whyTheBook.book.note}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
