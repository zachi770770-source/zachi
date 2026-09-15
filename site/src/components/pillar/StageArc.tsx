import Link from "next/link";

/**
 * קשת-השלב: ארבע תחנות בתוך „דייטים”, כרצף מסומן.
 *
 * הרעיון הוא שהקורא ימקם את עצמו. הוא יודע מה קורה אצלו אבל לא תמיד יודע איך
 * קוראים לזה, ובלי שם קשה לדעת מה השאלה הנכונה לשאול עכשיו. לכן כל תחנה
 * נושאת גם את השאלה הפתוחה שלה, ולא רק תיאור.
 *
 * הכול טקסט בשרת: הרצף מצויר ב-CSS בלבד (מספור + קו מקשר), בלי קנבס, בלי
 * ספרייה ובלי JS — מנוע חיפוש שקורא את ה-HTML מקבל את אותו מידע בדיוק
 * שהקורא מקבל.
 */
export function StageArc({
  title,
  lead,
  steps,
  nextHref,
  nextLabel,
}: {
  title: string;
  lead: string;
  steps: readonly {
    readonly name: string;
    readonly what: string;
    readonly question: string;
  }[];
  nextHref?: string;
  nextLabel?: string;
}) {
  return (
    <section aria-labelledby="stage-arc-heading" className="scroll-mt-24">
      <h2 id="stage-arc-heading" className="type-section font-serif text-foreground">
        {title}
      </h2>
      <p className="mt-3 max-w-[60ch] text-[1.05rem] leading-relaxed text-foreground-muted">
        {lead}
      </p>

      <ol className="mt-7 space-y-0">
        {steps.map((s, i) => (
          <li key={s.name} className="relative flex gap-4 pb-8 last:pb-0 sm:gap-5">
            {/* הקו המקשר בין התחנות. אחרון בלי קו. */}
            {i < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-9 bottom-0 start-[17px] w-px bg-border"
              />
            ) : null}
            <span
              aria-hidden="true"
              className="relative z-[1] mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-serif text-[15px] font-semibold text-brand"
            >
              {i + 1}
            </span>
            <div className="pt-1">
              <h3 className="font-serif text-[1.12rem] font-semibold text-foreground">{s.name}</h3>
              <p className="mt-1.5 max-w-[58ch] text-[1.01rem] leading-[1.8] text-foreground-muted">
                {s.what}
              </p>
              <p className="mt-2 max-w-[58ch] text-[1.01rem] leading-[1.8] text-foreground">
                <span className="text-foreground-muted">השאלה הפתוחה: </span>
                {s.question}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {nextHref && nextLabel ? (
        <Link
          href={nextHref}
          className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          {nextLabel}
        </Link>
      ) : null}
    </section>
  );
}
