/**
 * „שאלות שחוזרות” — לא רשימת שאלות-נפוצות, אלא **שתי נגינות** על העמוד.
 *
 * ── שלושת הכללים שלא השתנו ───────────────────────────────────────────────
 *   1. התוכן גלוי תמיד. אין אקורדיון שמסתיר תשובות מהקורא (ומקשה על זחילה),
 *      ואין שאלות שנוספו רק כדי להחזיק מילות-מפתח.
 *   2. השאלות נבדלות מ„בקצרה” שבראש העמוד: שם יושבות שאלות-הליבה, וכאן מה
 *      שנשאל *אחרי* שהבינו את ההבחנה.
 *   3. **אין סכימת `FAQPage`.** מדיניות הסכימה של האתר שומרת את `FAQPage`
 *      לעמוד ה-FAQ עצמו (`/faq`), שם השאלות הן הישות המרכזית של העמוד. כאן
 *      הן חלק ממאמר, והישות המרכזית היא ה-`Article`/`WebPage` שכבר מוצהר.
 *      `<dl>` ולא כותרות: אלה זוגות שאלה-תשובה, וזו הסמנטיקה הנכונה להם.
 *
 * ── מה כן השתנה, ולמה ────────────────────────────────────────────────────
 * הבלוק היה הרצף המונוטוני הארוך ביותר בעמוד — כ-1,400 פיקסלים (מסך וחצי
 * במובייל) של „שאלה בסריף מודגש · פסקה אפורה · קו מפריד”, בדיוק באותם גדלים
 * שבהם „בקצרה” כבר הופיע קודם. שני הבלוקים נראו כמו אותו רכיב פעמיים, וקווי
 * ההפרדה בין כל שני פריטים הם בדיוק הסימן שגורם לעמוד להיראות כמאמר.
 *
 * כאן זה נקרא כשיחה בין שני קולות, והם נבדלים בכל פרמטר:
 *
 *   • **השאלה** היא קולו של הקורא — קטנה (0.95rem), עם נקודת-טרקוטה כמו
 *     בכל סמן אחר בעמוד, יושבת בקצה ההתחלה.
 *   • **התשובה** היא קולו של הספר — גדולה יותר מקודם (1.08rem), בדיו מלא
 *     ולא באפור, ומוסטת פנימה. ההסטה היא מה שיוצר את הקצב: העין רואה
 *     שאלה-תשובה-שאלה-תשובה כזיגזג, בלי אף קו מפריד.
 *
 * כלומר ההיררכיה הפוכה בדיוק מזו של „בקצרה” — שם השאלה גדולה והתשובה קטנה.
 * זה מה שמונע משני הבלוקים להיקרא כאותו דבר.
 *
 * הערת-נגישות: הצבע האפור (`foreground-muted`) ירד מהתשובות. זה גוף-הטקסט
 * הארוך ביותר בעמוד, והוא עומד עכשיו על `foreground` (11.89:1) במקום 5.63:1.
 */
export function PillarFaq({
  title,
  items,
  variant = "list",
}: {
  title: string;
  items: readonly { readonly q: string; readonly a: string }[];
  /**
   * `"dialogue"` — הטיפול שמתואר למעלה, בעמודי-האב בלבד. שם הוא פותר בעיה
   * שקיימת רק שם: „בקצרה” כבר הופיע קודם באותו עמוד באותו מרקם בדיוק.
   *
   * `"list"` — ברירת המחדל, ומה שהמדריכים (23 עמודים) ממשיכים להציג. במדריך
   * אין „בקצרה”, ולכן אין שם את הכפילות שהצדיקה את השינוי; שינוי-מראה ב-23
   * עמודים שלא נבדקו חזותית בסבב הזה אינו דבר שנעשה בדרך אגב.
   */
  variant?: "list" | "dialogue";
}) {
  if (variant === "list") {
    return (
      <section aria-labelledby="faq-heading" className="scroll-mt-24">
        <h2 id="faq-heading" className="type-section font-serif text-foreground">
          {title}
        </h2>
        <dl className="mt-7 divide-y divide-border border-t border-border">
          {items.map((item) => (
            <div key={item.q} className="py-7">
              <dt className="font-serif text-[1.15rem] font-semibold leading-snug text-foreground">
                {item.q}
              </dt>
              <dd className="mt-3 max-w-[62ch] text-[1.02rem] leading-[1.85] text-foreground-muted">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }

  return (
    <section aria-labelledby="faq-heading" className="scroll-mt-24">
      <h2 id="faq-heading" className="type-section font-serif text-foreground">
        {title}
      </h2>
      <dl className="mt-9 sm:mt-11">
        {items.map((item, i) => (
          <div key={item.q} className={i === 0 ? "" : "mt-10 sm:mt-12"}>
            <dt className="flex items-start gap-2.5 text-[0.95rem] font-semibold leading-[1.65] text-ink-soft">
              <span
                aria-hidden="true"
                className="mt-[0.62em] h-[6px] w-[6px] shrink-0 rounded-full bg-brand"
              />
              <span className="max-w-[46ch]">{item.q}</span>
            </dt>
            {/* התשובה מוסטת פנימה בדיוק ברוחב הנקודה והרווח שלה, כך שהיא
                מתחילה מתחת לטקסט השאלה ולא מתחת לסמן. */}
            <dd className="mt-3 max-w-[58ch] ps-[calc(6px+0.625rem)] text-[1.08rem] leading-[1.9] text-foreground sm:ps-8">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
