import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { attachment } from "@/content/book";

/**
 * „ריקוד ההיקשרות” — הכוח הנסתר מאחורי הקלעים. זיהוי-עצמי חזק: הגדרה קצרה, שני
 * הסגנונות (חרדתי/נמנע), ומעגל 5 הצעדים. נסגר במשפט ההבטחה („כמו לחזור הביתה”),
 * בשאלה רפלקטיבית וב-CTA יחיד לטעימה. ניסוח איכותי — בלי אחוזים קשיחים.
 */
export function AttachmentSection() {
  return (
    <section
      id="attachment"
      className="scroll-mt-20 py-24 sm:py-32"
      aria-labelledby="attachment-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-3xl">
          <span className="kicker justify-center">{attachment.kicker}</span>
          <h2 id="attachment-heading" className="type-h2 mt-4 text-center">
            {attachment.title}
          </h2>
          <p className="type-lead mx-auto mt-4 max-w-[56ch] text-center text-foreground-muted">
            {attachment.definition}
          </p>
          <p className="mx-auto mt-3 max-w-[50ch] text-center text-[15px] leading-relaxed text-foreground-muted/90">
            {attachment.prevalence}
          </p>

          {/* שני הסגנונות */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {attachment.styles.map((s) => (
              <div key={s.name} className="rounded-2xl border border-border bg-surface p-6">
                <p className="text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
                  {s.name}
                </p>
                <p className="mt-3 text-[1.05rem] leading-relaxed text-foreground">{s.line}</p>
              </div>
            ))}
          </div>

          {/* מעגל 5 הצעדים */}
          <div className="mt-8 rounded-2xl border-s-2 border-brand bg-surface-muted/60 p-6 sm:p-8">
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
              {attachment.cycleTitle}
            </p>
            <ol className="mt-5 grid gap-3 sm:grid-cols-5">
              {attachment.cycle.map((c, i) => (
                <li key={c.step} className="rounded-xl border border-border bg-surface p-4">
                  <span
                    className="type-quote text-lg tabular-nums text-foreground-muted"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-1 font-serif text-[1rem] font-semibold text-foreground">
                    {c.step}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-foreground-muted">
                    {c.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* משפט ההבטחה + שאלה סוגרת + CTA יחיד */}
          <blockquote className="type-quote mx-auto mt-14 max-w-[42ch] text-center text-[clamp(1.3rem,2.8vw,1.75rem)] italic leading-snug text-foreground">
            {attachment.promise}
          </blockquote>
          <div className="mt-8 text-center">
            <p className="font-serif text-[1.15rem] font-semibold text-foreground">
              {attachment.reflect}
            </p>
            <Link
              href="/preview"
              className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-foreground px-7 text-[16px] font-semibold text-surface transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {attachment.reflectCtaLabel}
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
