import { SignatureMarkRule } from "@/components/pillar/PillarSignature";

/**
 * „בקצרה” — הבלוק הא-סימטרי של עמוד-האב.
 *
 * קודם זה היה כרטיס בתוך עמוד-הקריאה: תיבה ברוחב הטקסט עם רשת של שתי עמודות
 * בתוכה. זה עבד, אבל זו בדיוק הפריסה ש„כל אתר תוכן” משתמש בה.
 *
 * כאן הבלוק יוצא מעמוד-הקריאה ומתחלק לשניים: עמודה צרה לכותרת, ולצדה הרשת.
 * זו פריסה עריכתית אמיתית — הכותרת מתפקדת כתווית-שוליים ולא ככותרת-על — והיא
 * מנצלת את הרוחב שבדסקטופ ממילא עמד ריק, בלי להרחיב אף שורת טקסט.
 *
 * במובייל הכול נערם לעמודה אחת, והכותרת חוזרת להיות כותרת רגילה. הקו-והנקודה
 * מחזיקים את הקשר לשאר העמוד.
 */
export function QuickAnswers({
  title,
  items,
}: {
  title: string;
  items: readonly { readonly q: string; readonly a: string }[];
}) {
  return (
    <section
      aria-labelledby="quick-answers-heading"
      className="mx-auto w-full max-w-5xl border-t border-border pt-9 sm:pt-11"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,13rem)_1fr] lg:gap-12">
        <div>
          <SignatureMarkRule />
          <h2
            id="quick-answers-heading"
            className="mt-4 text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover"
          >
            {title}
          </h2>
        </div>
        <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.q}>
              <dt className="font-serif text-[1.1rem] font-semibold leading-snug text-foreground">
                {item.q}
              </dt>
              <dd className="mt-2 text-[0.98rem] leading-[1.8] text-foreground-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
