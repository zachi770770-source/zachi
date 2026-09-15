/**
 * „שאלות שחוזרות” — בלוק שאלות-נפוצות גלוי בתחתית עמוד-אב או מדריך.
 *
 * שלושה כללים שמפרידים בין זה לבין בלוק-FAQ ל-SEO:
 *
 *   1. התוכן גלוי תמיד. אין אקורדיון שמסתיר תשובות מהקורא (ומקשה על זחילה),
 *      ואין שאלות שנוספו רק כדי להחזיק מילות-מפתח.
 *   2. השאלות נבדלות מ„בקצרה” שבראש העמוד: שם יושבות שאלות-הליבה, וכאן מה
 *      שנשאל *אחרי* שהבינו את ההבחנה.
 *   3. **אין סכימת `FAQPage`.** מדיניות הסכימה של האתר שומרת את `FAQPage`
 *      לעמוד ה-FAQ עצמו (`/faq`), שם השאלות הן הישות המרכזית של העמוד. כאן
 *      הן חלק ממאמר, והישות המרכזית היא ה-`Article`/`WebPage` שכבר מוצהר.
 *      סימון כפול לא היה מוסיף תוצאה עשירה (גוגל צימצם את FAQ rich results
 *      לאתרים ממשלתיים/רפואיים בלבד) והיה רק מנפח את הסכימה.
 *
 * `<dl>` ולא כותרות: אלה זוגות שאלה-תשובה, וזו המשמעות הסמנטית הנכונה להם.
 */
export function PillarFaq({
  title,
  items,
}: {
  title: string;
  items: readonly { readonly q: string; readonly a: string }[];
}) {
  return (
    <section aria-labelledby="faq-heading" className="scroll-mt-24">
      <h2 id="faq-heading" className="type-h2 font-serif text-foreground">
        {title}
      </h2>
      <dl className="mt-6 divide-y divide-border border-t border-border">
        {items.map((item) => (
          <div key={item.q} className="py-6">
            <dt className="font-serif text-[1.15rem] font-semibold leading-snug text-foreground">
              {item.q}
            </dt>
            <dd className="mt-2.5 max-w-[62ch] text-[1.02rem] leading-[1.8] text-foreground-muted">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
