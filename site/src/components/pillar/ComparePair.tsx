/**
 * בלוק-השוואה קצר: אותו רגע, שתי קריאות שונות שלו.
 *
 * קיים במקום אחד בכל עמוד-אב, ולא כדי „לשבור טקסט” אלא מפני שההבחנה עצמה היא
 * זוגית: כשפסקה מונה שני דברים שמרגישים זהים מבפנים ומובילים לכיוונים הפוכים,
 * להציג אותם זה לצד זה זו הצורה הנכונה להם, לא קישוט.
 *
 * מרוסן בכוונה: שני תאים, בלי אייקונים, בלי צבעי-אזהרה ובלי „נכון/לא נכון”.
 * הצד הימני והשמאלי שווים בעיצובם, כי גם בתוכן אף אחד מהם אינו „הטעות”.
 *
 * במובייל נערם לעמודה אחת ומייצר נקודת-נשימה באמצע קריאה ארוכה.
 */
export function ComparePair({
  lead,
  left,
  right,
}: {
  lead?: string;
  left: { readonly label: string; readonly body: string };
  right: { readonly label: string; readonly body: string };
}) {
  return (
    <div className="mt-6">
      {lead ? (
        <p className="max-w-[60ch] text-[1.01rem] leading-[1.8] text-foreground-muted">{lead}</p>
      ) : null}
      <dl className="mt-5 grid items-stretch gap-4 sm:grid-cols-2">
        {[left, right].map((side) => (
          <div
            key={side.label}
            className="flex h-full flex-col rounded-2xl border border-border bg-surface p-[22px] sm:p-6"
          >
            <dt className="text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
              {side.label}
            </dt>
            <dd className="mt-2.5 font-serif text-[1.12rem] leading-snug text-foreground">
              {side.body}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
