import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

import { methods } from "@/content/methods";
import type { JourneyDepthPoint } from "@/content/journeyPages";

/**
 * „רגע של מראה” אינטראקטיבי — מערכת אחת החוזרת בכל חמשת עמודי-המסע, מוזנת מתוכן
 * העמוד הקיים בלבד. הקורא עוצר, בוחר את האמירה שהכי קרובה אליו כרגע, ומיד נחשף
 * ה-outcome *הייחודי לבחירה שלו* — „זה מה שקורה לי עכשיו”:
 *   1. שיקוף קצר — מה הבחירה מזמינה לבדוק עכשיו.
 *   2. שאלה אחת להמשך מחשבה.
 *   3. צעד ראשי אחד מכאן (כלי/מדריך קיים), + מושג-ספר קנוני מלווה (אופציונלי).
 *
 * הבחירה משנה בפועל את מה שמתקבל: לכל אחת משלוש האפשרויות outcome משלה. שתי
 * אפשרויות רשאיות לחלוק אותו מושג-ספר כשהוא נכון תוכנית, אך השיקוף/השאלה/היעד
 * שונים. זה אינו העוזר („שאל את הספר”): אין אבחון, אין נכון/לא-נכון, אין הסתעפות
 * למנוע — רק זיהוי-עצמי עריכתי שמכוון להמשך המדויק של הבחירה.
 *
 * מימוש CSS טהור מבוסס-רדיו (ללא JS, ללא state, ללא רשת, ללא אחסון): נגיש
 * במקלדת ובקורא-מסך (radiogroup נייטיב), עובד גם ללא JS, וללא סיכון-הידרציה.
 * מוצג outcome אחד בלבד בכל רגע — של האפשרות הנבחרת; בחירה אחרת מחליפה אותו ואינה
 * מוסיפה עליו (אין stacking). הבחירה אינה נשמרת — רענון מאפס.
 */
export function JourneyMirror({
  id,
  points,
}: {
  id: string;
  points: readonly JourneyDepthPoint[];
}) {
  const name = `journey-mirror-${id}`;
  return (
    <div className="mt-7">
      <p className="type-literary text-[clamp(1.2rem,2vw,1.45rem)] font-semibold text-foreground">
        מה הכי קרוב אליי כרגע?
      </p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-foreground-muted">
        בחרו את מה שהכי מדבר אליכם עכשיו. אין כאן נכון או לא נכון.
      </p>

      <fieldset className="mt-5">
        <legend className="sr-only">מה הכי קרוב אליי כרגע?</legend>
        <div className="flex flex-col">
          {points.map((p, i) => {
            const inputId = `${name}-${i}`;
            const { outcome } = p;
            const method = outcome.methodSlug ? methods[outcome.methodSlug] : undefined;
            return (
              <div
                key={p.title}
                className="border-t border-border-strong py-5 transition-[padding] has-[:checked]:border-s-2 has-[:checked]:border-s-brand has-[:checked]:ps-4 sm:has-[:checked]:ps-6"
              >
                <input
                  id={inputId}
                  type="radio"
                  name={name}
                  className="peer sr-only"
                />
                <label
                  htmlFor={inputId}
                  className="flex cursor-pointer items-baseline gap-4 text-foreground transition-colors hover:text-brand-hover peer-checked:text-brand-hover peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-brand"
                >
                  <span
                    aria-hidden="true"
                    className="font-serif text-[1.75rem] font-bold leading-none text-brand/85 sm:text-[2rem]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif text-[clamp(1.2rem,1.8vw,1.5rem)] font-bold leading-tight [text-wrap:balance]">
                    {p.title}
                  </span>
                </label>

                {/* ה-outcome — נחשף רק כשהאמירה נבחרה (הרגע של „זה אני”). CSS
                    טהור: מוצג רק לאפשרות הנבחרת, ומתחלף מיד בבחירה אחרת. */}
                <div className="mt-2.5 hidden ps-11 peer-checked:block sm:ps-12">
                  {/* משפט-הזיהוי הקצר + השיקוף למה שכדאי לבדוק עכשיו. */}
                  <p className="text-[1.0625rem] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                    {p.line}
                  </p>
                  <p className="mt-2 text-[1.0625rem] leading-relaxed text-foreground [text-wrap:pretty]">
                    {outcome.reflection}
                  </p>

                  {/* שאלה אחת להמשך מחשבה. */}
                  <p className="mt-4 type-literary text-[1.05rem] font-medium leading-snug text-brand-hover [text-wrap:pretty]">
                    {outcome.question}
                  </p>

                  {/* צעד ראשי אחד מכאן. */}
                  <div className="mt-4">
                    <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-brand-hover">
                      מכאן אפשר להמשיך
                    </p>
                    <Link
                      href={outcome.primaryAction.href}
                      className="mt-2 inline-flex items-center gap-2 text-[16px] font-semibold text-foreground underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                    >
                      {outcome.primaryAction.label}
                      <ArrowLeft
                        className="h-4 w-4 shrink-0 text-brand"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>

                  {/* מושג-ספר קנוני מלווה (אופציונלי) — לא מוצג כשהפעולה הראשית
                      עצמה היא עמוד-מושג. */}
                  {method ? (
                    <Link
                      href={method.path}
                      className="mt-3 inline-flex items-center gap-2 text-[15px] font-medium text-foreground-muted underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                    >
                      <BookOpen className="h-4 w-4 text-brand" aria-hidden="true" />
                      המושג מהספר: „{method.term}”
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
