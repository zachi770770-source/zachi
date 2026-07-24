import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { behind } from "@/content/book";

/**
 * "מאחורי הספר" - מחליף את אזור המחבר כל עוד אין שם, תמונה וביוגרפיה
 * אמיתיים. אין אווטאר מזויף ואין ביוגרפיה מומצאת - טקסט על מטרת הספר בלבד.
 */
export function BehindSection() {
  return (
    <section
      id="behind"
      className="scroll-mt-20 py-24 sm:py-32"
      aria-labelledby="behind-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-3xl">
          <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-hover">
            {behind.eyebrow}
          </span>
          <h2 id="behind-heading" className="type-h2 mt-4">
            {behind.title}
          </h2>
          <div className="mt-8 flex flex-col gap-5 border-r-2 border-brand/30 pr-6 sm:pr-8">
            {behind.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-[19px] leading-[1.75] text-foreground-muted"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
