import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { readiness, patterns } from "@/content/book";

/**
 * „למה אנחנו נתקעים” — שאלת המוכנות והדפוסים הלא-מודעים. זיהוי-עצמי לפני
 * הפתרון, בין „למי הספר” ל„השיטה”.
 *
 * גרסה מרוסנת: הסקשן הוסר בעבר מ-/book כדי לקצר את העמוד, אבל הוא נושא תוכן
 * מאושר (שאלת המוכנות, הציטוט, ושלושת הדפוסים) — ולכן חזר. מה שהצטמצם הוא
 * ה*נפח*, לא המשמעות: ריפוד מחצית (py-24/32 → py-14/20), טיפוגרפיה קטנה
 * בדרגה, והדפוסים כרשימת-הגדרות אחת (שם · רקע · הצורך) במקום טבלה בת שלוש
 * עמודות עם שורת-כותרות נפרדת. אותו טקסט בדיוק, פחות ארכיטקטורה.
 */
export function PatternsSection() {
  return (
    <section
      id="patterns"
      className="scroll-mt-20 border-y border-border bg-surface-muted/40 py-14 sm:py-20"
      aria-labelledby="patterns-heading"
    >
      <Container>
        {/* שאלת המוכנות — הציטוט והשאלה שמזיזה את הפוקוס פנימה */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">{readiness.kicker}</span>
          <blockquote className="type-literary mt-4 text-[clamp(1.1rem,2.1vw,1.35rem)] font-medium leading-snug text-foreground">
            „{readiness.quote}”
          </blockquote>
          <p className="mt-5 font-serif text-[clamp(1.25rem,2.6vw,1.6rem)] font-semibold leading-tight text-brand-hover">
            {readiness.question}
          </p>
          <p className="mx-auto mt-3 max-w-[54ch] text-[15px] leading-relaxed text-foreground-muted">
            {readiness.framing}
          </p>
        </Reveal>

        {/* הדפוסים הלא מודעים — רשימת-הגדרות קומפקטית */}
        <Reveal className="mx-auto mt-10 max-w-2xl sm:mt-12">
          <h2 id="patterns-heading" className="type-h3 text-center">
            {patterns.title}
          </h2>
          <p className="mx-auto mt-3 max-w-[54ch] text-center text-[15px] leading-relaxed text-foreground-muted">
            {patterns.intro}
          </p>

          <ul className="mt-7 space-y-3">
            {patterns.rows.map((r) => (
              <li
                key={r.pattern}
                className="rounded-xl border border-border bg-surface px-5 py-4"
              >
                <p className="font-serif text-[1.05rem] font-semibold leading-snug text-foreground">
                  {r.pattern}
                </p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-foreground-muted">
                  <span className="text-ink-soft">{patterns.columns[1]}:</span> {r.root}
                  {" · "}
                  <span className="text-ink-soft">{patterns.columns[2]}:</span> {r.need}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
