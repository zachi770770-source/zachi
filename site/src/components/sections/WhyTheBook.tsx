import { Container } from "@/components/shared/Container";
import { whyTheBook } from "@/content/homeStory";

/**
 * התשובה לשאלה המסחרית שהעמוד לא ענה עליה: אם באתר יש מדריכים, כלים,
 * עמודי-מסע ו„שאל את הספר” — למה בכלל לקנות ספר?
 *
 * התשובה לא מתגוננת ולא מקטינה את האתר. היא מציגה הבדל אמיתי במבנה: האתר הוא
 * נקודות כניסה שכל אחת עומדת בפני עצמה; הספר הוא אותו מסע לפי סדר. שני הצדדים
 * מוצגים זה מול זה כדי שההבדל יהיה נראה, לא מוסבר.
 *
 * הרשימה של „בספר” היא תוכן-העניינים המאושר — לא הבטחה ולא רשימת פיצ׳רים.
 */
export function WhyTheBook() {
  return (
    <section aria-labelledby="why-book-heading" className="py-8 sm:py-14">
      <Container>
        {/* רוחב הכותרת מיושר לרוחב שתי הכרטיסיות שמתחתיה, כדי שהטענה והראיה
            שלה ייקראו כגוש אחד ולא כשתי יחידות ברוחב שונה. */}
        <div className="reveal mx-auto max-w-3xl text-center">
          <span className="kicker justify-center">{whyTheBook.eyebrow}</span>
          <h2 id="why-book-heading" className="type-h2 mt-3 [text-wrap:balance]">
            {whyTheBook.title}
          </h2>
        </div>

        <div className="reveal mx-auto mt-7 grid max-w-3xl gap-3 sm:mt-9 sm:grid-cols-2 sm:gap-5">
          {/* האתר — מכוון, שקט, משטח רגיל */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-foreground-muted">
              {whyTheBook.site.label}
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {whyTheBook.site.lines.map((line) => (
                <li
                  key={line}
                  className="flex gap-2.5 text-[15px] leading-relaxed text-foreground [text-wrap:pretty]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-border-strong"
                  />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-border pt-3 text-[13.5px] leading-snug text-foreground-muted">
              {whyTheBook.site.note}
            </p>
          </div>

          {/* הספר — הצד שאליו רוצים להוביל: מסגרת מודגשת וסדר ממוספר. */}
          <div className="rounded-2xl border-2 border-brand/45 bg-surface-muted/50 p-5 sm:p-6">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
              {whyTheBook.book.label}
            </p>
            <ol className="mt-4 flex flex-col gap-2.5">
              {whyTheBook.book.lines.map((line, i) => (
                <li
                  key={line}
                  className="flex gap-2.5 text-[15px] leading-relaxed text-foreground [text-wrap:pretty]"
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
            <p className="mt-4 border-t border-border pt-3 text-[13.5px] leading-snug text-foreground-muted">
              {whyTheBook.book.note}
            </p>
          </div>
        </div>

        <p className="reveal mx-auto mt-6 max-w-2xl text-center font-serif text-[clamp(1.05rem,1.7vw,1.3rem)] font-semibold leading-snug text-foreground [text-wrap:balance]">
          {whyTheBook.closing}
        </p>
      </Container>
    </section>
  );
}
