import Link from "next/link";
import { BookOpen } from "lucide-react";

interface MirrorPoint {
  title: string;
  line: string;
}

/**
 * „רגע של מראה” אינטראקטיבי — מערכת אחת החוזרת בכל ארבעת עמודי-המסע, מוזנת
 * מתוכן העמוד הקיים בלבד (שלוש נקודות-העומק). הקורא עוצר, בוחר את האמירה שהכי
 * קרובה אליו כרגע, ומיד נחשפת הפסקה שמעמיקה בדיוק בה — „זה מה שקורה לי עכשיו” —
 * ואז מוצע המשך: המושג מהספר שממסגר את הבחירה (הכניסה לעוזר נשארת בסקשן שאחרי).
 *
 * זה אינו העוזר („שאל את הספר”): העוזר מסתעף לכלי שונה לפי תשובה; כאן אין הסתעפות,
 * אין אבחון ואין נכון/לא-נכון — רק זיהוי-עצמי עריכתי שמכוון להמשך של השלב.
 *
 * מימוש CSS טהור מבוסס-רדיו (ללא JS, ללא state, ללא רשת, ללא אחסון): נגיש
 * במקלדת ובקורא-מסך (radiogroup נייטיב), עובד גם ללא JS, וללא סיכון-הידרציה.
 * הבחירה אינה נשמרת — רענון מאפס. אין אנימציה: החשיפה מיידית ורגועה.
 */
export function JourneyMirror({
  id,
  points,
  method,
}: {
  id: string;
  points: readonly MirrorPoint[];
  method?: { path: string; term: string } | null;
}) {
  const name = `journey-mirror-${id}`;
  return (
    <div className="group/mirror mt-7">
      <p className="font-serif text-[clamp(1.2rem,2vw,1.45rem)] font-semibold text-foreground">
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
                {/* הפסקה המעמיקה — נחשפת רק כשהאמירה נבחרה (הרגע של „זה אני”). */}
                <p className="mt-2.5 hidden ps-11 text-[1.0625rem] leading-relaxed text-foreground-muted [text-wrap:pretty] peer-checked:block sm:ps-12">
                  {p.line}
                </p>
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* המשך — מופיע רק אחרי בחירה. המושג מהספר שממסגר את השלב. הכניסה לעוזר
          („שאל את הספר”) נשמרת בסקשן „רגע של מראה” שמיד אחרי זה. */}
      {method ? (
        <div className="mt-6 hidden border-t border-border pt-5 group-has-[:checked]/mirror:block">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-brand-hover">
            מכאן אפשר להמשיך
          </p>
          <Link
            href={method.path}
            className="mt-2 inline-flex items-center gap-2 text-[16px] font-semibold text-foreground underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <BookOpen className="h-4 w-4 text-brand" aria-hidden="true" />
            המושג מהספר: „{method.term}”
          </Link>
        </div>
      ) : null}
    </div>
  );
}
