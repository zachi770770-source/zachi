import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { homePaths, homePathUi } from "@/content/homePaths";

/**
 * לב עמוד הבית: „איפה זה פוגש אותך עכשיו?” — שער אמיתי לארבע החוויות.
 * כל מצב הוא *קישור אחד* אל עמוד-המסע שלו: לחיצה או הקשה מנווטות מיד, בלי שלב
 * „בחירה ואז המשך”. הכרטיס כולו הוא שטח-הלחיצה (יעד-מגע גדול), והניווט הוא
 * ניווט-צד-לקוח רגיל, באותה לשונית.
 *
 * ארכיטקטורה: רכיב שרת בלבד (ללא "use client"), בלי state ובלי JS. ארבעת
 * הקישורים קיימים תמיד ב-HTML (SEO + עבודה מלאה ללא הידרציה), והם `<a>` נטיבי —
 * כלומר Tab מגיע אליהם ו-Enter מפעיל אותם בלי שורת קוד נוספת ובלי „חטיפת” קליק
 * מ-radio (שהיה מנווט גם בחיצי-מקלדת, ולכן נפסל).
 *
 * מסלול-התחנות (.path-stations) נשמר כ*מפה* של המסע: קו אחד שמחבר את התחנות,
 * וצומת שמתעורר בריחוף/פוקוס כתצוגה-מקדימה של „לכאן אני נכנס”. ההתקדמות
 * האמיתית („תחנה N מתוך 3”) חיה בעמוד-היעד (JourneyPosition) — בעמוד הבית עוד
 * לא הלכנו לשום מקום, ולכן שום מקטע אינו מסומן כ„נעבר”.
 *
 * ה-IA נשמר: שלוש תחנות במחזור + „אחרי פרידה” כשער מעבר (מסומן בבאדג'), ולכן
 * גם כאן השער אינו נצבע כתחנה רביעית.
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

        <div className="path-choose mx-auto mt-5 max-w-2xl sm:max-w-4xl">
          <ul className="path-stations relative grid grid-cols-1 gap-2.5 sm:grid-cols-4 sm:gap-4">
            {homePaths.map((p, index) => (
              // `contents` — הפריט אינו יוצר תיבה משלו, כך שהקישור עצמו הוא תא
              // הרשת ומקבל את גובה השורה המלא (יעד-מגע גדול, מסלול מיושר).
              <li key={p.id} className="contents">
                <Link
                  href={p.stationHref}
                  data-index={index}
                  className="path-station lift-hover relative flex items-center justify-between gap-2 rounded-xl border-2 border-border bg-surface p-3 text-start transition-colors hover:border-brand/50 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:flex-col sm:items-start sm:gap-3 sm:rounded-2xl sm:p-5"
                >
                  {/* צומת התחנה — במרזב-המסלול, מחוץ לגוף הכרטיס, כדי שהקו לא
                      ייחבא מאחורי רקע הכרטיס. דקורטיבי בלבד. */}
                  <span className="path-station__node" aria-hidden="true" />
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
                    {/* שורת-הזיהוי היא *הסיבה* שהכרטיס אינו כפתור-ניווט: היא
                        מתארת את התחושה, לא את היעד. לכן היא מוצגת גם במובייל —
                        להסתיר אותה שם היה משאיר לרוב המבקרים בדיוק את התפריט
                        שביקשנו לא להיות. */}
                    <span className="mt-1 block text-[13.5px] leading-snug text-foreground-muted [text-wrap:pretty] sm:text-[15px]">
                      {p.buttonSub}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="path-arrow inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand transition-colors sm:h-10 sm:w-10 sm:self-end"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
