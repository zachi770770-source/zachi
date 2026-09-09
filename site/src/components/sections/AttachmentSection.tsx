import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { attachment } from "@/content/book";

/**
 * „ריקוד ההיקשרות” — הכוח שמאחורי הקלעים: הגדרה קצרה, שני הסגנונות, והמעגל
 * שביניהם. נסגר במשפט ההבטחה, בשאלה רפלקטיבית וב-CTA יחיד לטעימה.
 *
 * גרסה מרוסנת: התוכן המאושר נשמר במלואו, הנפח צומצם. הריפוד ירד למחצית,
 * מעגל חמשת הצעדים הפך משורת-כרטיסים לרצף-נשימה אחד מופרד בנקודות (אותם
 * חמישה צעדים, בלי חמישה כרטיסים), וה-CTA עבר לצבע-המערכת (פטרול + שנהב)
 * במקום `bg-foreground` — היררכיית-הפעולות שכבר אושרה.
 */
export function AttachmentSection({
  /**
   * „book” — הבלוק מוצג מחוץ לעמוד-המדריך ולכן נושא קישור-העמקה אליו.
   * „guide” — הבלוק כבר *בתוך* עמוד-המדריך; קישור לעצמו הוא קישור מת, ולכן
   * הוא אינו מוצג. אותו תוכן, בלי הפניה מעגלית.
   */
  context = "book",
}: {
  context?: "book" | "guide";
} = {}) {
  return (
    <section
      id="attachment"
      className="scroll-mt-20 py-14 sm:py-20"
      aria-labelledby="attachment-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl">
          <span className="kicker justify-center">{attachment.kicker}</span>
          <h2 id="attachment-heading" className="type-h3 mt-3 text-center">
            {attachment.title}
          </h2>
          <p className="mx-auto mt-3 max-w-[56ch] text-center text-[15px] leading-relaxed text-foreground-muted">
            {attachment.definition}
          </p>
          <p className="mx-auto mt-2 max-w-[50ch] text-center text-[14.5px] leading-relaxed text-foreground-muted">
            {attachment.prevalence}
          </p>

          {/* שני הסגנונות — זה לצד זה, ללא כרטיסים גבוהים */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {attachment.styles.map((s) => (
              <div key={s.name} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-[12.5px] font-semibold uppercase tracking-wide text-ink-soft">
                  {s.name}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-foreground">{s.line}</p>
              </div>
            ))}
          </div>

          {/* המעגל — רצף אחד, לא חמישה כרטיסים */}
          <div className="mt-5 rounded-xl border-s-2 border-sage-ink bg-surface-muted/60 px-5 py-4">
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-ink-soft">
              {attachment.cycleTitle}
            </p>
            <ol className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-[14.5px] leading-relaxed">
              {attachment.cycle.map((c, i) => (
                <li key={c.step} className="text-foreground-muted">
                  {i > 0 ? <span aria-hidden="true" className="me-1.5 text-border-strong">·</span> : null}
                  <span className="font-semibold text-foreground">{c.step}</span>{" "}
                  {c.text}
                </li>
              ))}
            </ol>
          </div>

          {/* משפט ההבטחה + שאלה סוגרת + CTA יחיד */}
          <blockquote className="type-literary mx-auto mt-9 max-w-[42ch] text-center text-[clamp(1.15rem,2.3vw,1.45rem)] font-medium leading-snug text-foreground">
            {attachment.promise}
          </blockquote>
          <div className="mt-6 text-center">
            <p className="font-serif text-[1.1rem] font-semibold text-foreground">
              {attachment.reflect}
            </p>
            <Link
              href="/preview"
              className="mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[color:var(--color-petrol)] px-7 text-[16px] font-semibold text-[color:var(--color-secondary-foreground)] transition-colors hover:bg-[color:var(--color-petrol-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {attachment.reflectCtaLabel}
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            {/* קישור-עוגן אחד למדריך סגנונות ההתקשרות — הרחבה של הריקוד שמתואר
                כאן. אינו מוצג כשהבלוק עצמו יושב בתוך אותו מדריך: קישור לעצמו
                אינו הרחבה. הפסקה כולה יורדת, ולא רק הקישור, כדי שלא יישאר
                ריווח של אלמנט ריק. */}
            {context === "book" ? (
              <p className="mt-4 text-[14.5px] leading-relaxed text-foreground-muted">
                <Link
                  href="/guide/attachment-styles"
                  className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  להבין לעומק: סגנונות התקשרות בזוגיות, חרדתי, נמנע ומה קורה ביניהם
                </Link>
              </p>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
