import { journeyInteractions } from "@/content/journeyInteractions";
import type { JourneyId } from "@/content/journeyPages";

/**
 * „פעולה קטנה אחת” של תחנת-מסע — רכיב אחד, מונחה-data (`journeyInteractions`),
 * שמשרת את כל חמש התחנות. לא כלי חדש ולא שאלון: המבקר/ת מסמן/ת בחירה אחת, ומיד
 * נחשף שיקוף קצר שמתאים לשלב.
 *
 * ארכיטקטורה: רכיב שרת בלבד (ללא "use client"). כל שאלה היא radiogroup נטיבי,
 * והשיקוף נחשף דרך CSS ‏`:has(input:checked)` — עובד עם מקלדת וקורא-מסך, וה-state
 * ephemeral לחלוטין (אין JS, אין localStorage/cookies/DB; שום דבר לא נשמר אחרי
 * העמוד). המצב נמסר גם בטקסט (השיקוף שנחשף), לא בצבע בלבד.
 */
export function JourneyInteraction({ id }: { id: JourneyId }) {
  const data = journeyInteractions[id];

  return (
    // „תרגול קצר” editorial — *ללא* card: מחובר ויזואלית ל„מה הכי קרוב אליי”
    // שקדם לו (אותו beat של עבודה), כדי שלא ייקרא כשאלון שני. הכותרת בדרגת
    // תת-כותרת (לא section-heading), וההכלה משתמעת מ-whitespace וטיפוגרפיה בלבד.
    <section
      aria-labelledby="journey-interaction-heading"
      className="reveal"
    >
      {/* framing של „יישום” — הרכיב המשותף קובע את המסגור (לא ה-data): הכותרת-
          העל אומרת שזהו שלב היישום, וה-lead גושר במפורש מהבחירה ב„מה הכי קרוב
          אליי” (זיהוי-עצמי) אל תרגול על מצב/אדם ממשי. תוכן ומשמעות כל האינטראקציות
          נשמרים — זהו microcopy framing בלבד. */}
      <span className="kicker">עכשיו ליישום</span>
      <h2
        id="journey-interaction-heading"
        className="mt-3 font-serif text-[clamp(1.2rem,1.9vw,1.5rem)] font-bold leading-[1.2] text-foreground [text-wrap:balance]"
      >
        {data.title}
      </h2>
      <p className="mt-3 max-w-[54ch] text-[1.0625rem] leading-relaxed text-foreground-muted [text-wrap:pretty]">
        <span className="font-semibold text-foreground">
          כבר זיהיתם מה הכי קרוב אליכם — עכשיו נסו את אותה הבחנה על מצב או אדם ממשי.
        </span>{" "}
        {data.intro}
      </p>
      {data.note ? (
        <p className="mt-2 text-[13px] font-medium tracking-[0.01em] text-foreground-muted/90">
          {data.note}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-5">
        {data.items.map((item, i) => {
          const name = `ji-${id}-${i}`;
          return (
            <fieldset key={item.prompt} className="ji-item border-0 p-0">
              <legend className="ji-prompt float-none p-0 text-[1.0625rem] font-semibold text-foreground [text-wrap:pretty]">
                {item.prompt}
              </legend>
              <div
                role="radiogroup"
                aria-label={item.prompt}
                className="mt-3 flex flex-col gap-2.5"
              >
                {item.choices.map((choice, c) => (
                  <div key={choice.label} className="ji-choice">
                    <label className="ji-chip">
                      <input
                        type="radio"
                        name={name}
                        value={`${c}`}
                        className="sr-only"
                      />
                      {/* סימן-בחירה לא-צבעוני: מופיע כשמסומן (לא צבע בלבד). */}
                      <span className="ji-mark" aria-hidden="true" />
                      <span className="ji-chip-label">{choice.label}</span>
                    </label>
                    {/* נחשף אחרי הבחירה — השיקוף של אותה בחירה בלבד. */}
                    <div className="ji-reflect mt-2 ps-1">
                      {choice.tag ? (
                        <span className="ji-tag inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-bold">
                          {choice.tag}
                        </span>
                      ) : null}
                      <p className="mt-1.5 text-[15px] leading-relaxed text-foreground [text-wrap:pretty]">
                        {choice.reflection}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>

      <p className="mt-6 border-t border-border pt-5 type-literary text-[1.0625rem] font-medium text-brand-hover [text-wrap:balance]">
        {data.closing}
      </p>
    </section>
  );
}
