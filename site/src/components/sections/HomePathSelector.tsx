import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { homePaths, homePathUi } from "@/content/homePaths";

/**
 * לב עמוד הבית: „איפה זה פוגש אותך עכשיו?” — לא רק תפריט ניווט, אלא רגע זיהוי.
 * רשת 2×2 סורקת (ארבעה מצבים במבט אחד) + *תגובה משותפת אחת* מתחת: בחירת מצב
 * חושפת זיהוי קצר + מוקד אחד + קישור-המשך אמיתי לעמוד-המסע. בחירה וניווט נפרדות:
 * הכרטיס בוחר (radio), הקישור מנווט — אין „חטיפת” קליק.
 *
 * ארכיטקטורה: רכיב שרת בלבד (ללא "use client"). בחירה = radiogroup נטיבי;
 * התגובה המשותפת מתחלפת דרך CSS ‏`:has(input:checked)` — בלי JS, בלי state.
 * עובד גם ללא הידרציה: ה-radio נבחר נטיבית, וארבעת קישורי-ההמשך קיימים תמיד
 * ב-HTML (SEO + ללא-JS). התוכן (זיהוי + מוקד) הוא תוכן מאושר קיים מ-`homePaths`
 * (heading + focuses[0]); אין קופי חדש, אין persona, אין localStorage, אין אנליטיקה.
 */
export function HomePathSelector() {
  return (
    <section id="path" className="scroll-mt-20 py-5 sm:py-10" aria-labelledby="path-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">{homePathUi.eyebrow}</span>
          <h2 id="path-heading" className="type-h2 mt-2">
            {homePathUi.heading}
          </h2>
          <p className="type-lead mx-auto mt-2 max-w-[42ch] text-foreground-muted [text-wrap:pretty]">
            {homePathUi.sub}
          </p>
          <p className="mx-auto mt-2 max-w-xl text-[14px] italic text-foreground-muted">
            לא צריך לדעת הכול כדי להתחיל נכון.
          </p>
        </div>

        {/* מ-sm ומעלה השורה רחבה יותר מרוחב-הקריאה: ארבע תחנות זו לצד זו
            צריכות מקום כדי שהכותרות לא תישברנה לשלוש שורות. פאנל-התוכן שמתחת
            נשאר ברוחב קריאה נוח (max-w-2xl משלו). */}
        <fieldset className="path-choose mx-auto mt-5 max-w-2xl border-0 p-0 sm:max-w-4xl">
          <legend className="sr-only">{homePathUi.heading}</legend>

          {/* מסלול אחד, ארבע תחנות. הקו והצמתים נמשכים ב-CSS טהור מתוך אותו
              radio שכבר קיים (‏`:has(:checked)`) — אין JS, אין state, ואין שינוי
              בסמנטיקה: כל תחנה נשארת label עם radio נגיש. במובייל המסלול אנכי
              (מרזב בצד-ההתחלה), בדסקטופ אופקי מעל השורה. ראו .path-stations. */}
          <div className="path-stations relative grid grid-cols-1 gap-2.5 sm:grid-cols-4 sm:gap-4">
            {homePaths.map((p, index) => (
              <label
                key={p.id}
                data-index={index}
                className="path-station lift-hover relative flex cursor-pointer items-center justify-between gap-2 rounded-xl border-2 border-border bg-surface p-3 text-start transition-colors hover:bg-surface-muted has-[:checked]:border-brand has-[:checked]:bg-surface-muted has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand sm:flex-col sm:items-start sm:gap-3 sm:rounded-2xl sm:p-5"
              >
                {/* צומת התחנה — יושב במרזב-המסלול (מחוץ לכרטיס), כדי שהקו לעולם
                    לא ייחבא מאחורי רקע הכרטיס. דקורטיבי: המצב האמיתי מגיע
                    מה-radio ומהמסגרת הנבחרת. */}
                <span className="path-station__node" aria-hidden="true" />
                <input type="radio" name="home-stage" value={p.id} className="sr-only" />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-serif text-[15px] font-bold leading-tight text-foreground sm:text-[1.3rem]">
                      {p.buttonTitle}
                    </span>
                    {p.gate ? (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground sm:text-[12px]">
                        {homePathUi.gateBadge}
                      </span>
                    ) : null}
                  </span>
                  {/* שורת-משנה — מוסתרת במובייל (כרטיסי 2×2 קצרים), גלויה מ-sm. */}
                  <span className="mt-1 hidden text-[13.5px] leading-snug text-foreground-muted [text-wrap:pretty] sm:block sm:text-[15px]">
                    {p.buttonSub}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="path-arrow inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand transition-colors sm:h-10 sm:w-10 sm:self-end"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
              </label>
            ))}
          </div>

          {/* תגובה משותפת אחת, במקום יציב מתחת לרשת — מתחלפת לפי הבחירה. */}
          <div className="path-panels mx-auto mt-3 max-w-2xl sm:mt-4" aria-live="polite">
            {homePaths.map((p) => {
              const micro = p.focuses[0];
              return (
                <div
                  key={p.id}
                  data-stage={p.id}
                  className="path-panel rounded-xl border-s-2 border-s-brand bg-surface-muted/50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5"
                >
                  <p className="font-serif text-[16px] font-semibold leading-snug text-foreground [text-wrap:pretty] sm:text-[18px]">
                    {p.heading}
                  </p>
                  <p className="mt-3 text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                    {micro.title}
                  </p>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                    {micro.line}
                  </p>
                  <Link
                    href={p.stationHref}
                    className="group mt-4 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  >
                    {p.stationLabel}
                    <ArrowLeft
                      className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        </fieldset>
      </Container>
    </section>
  );
}
