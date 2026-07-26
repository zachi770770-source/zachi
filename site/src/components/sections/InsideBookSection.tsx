import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { preview, tools } from "@/content/book";

/**
 * "מה יש בתוך הספר" - תוכן עניינים בסגנון עריכתי (לא רשת תיבות),
 * ולצידו מבחר כלים מעשיים בשמותיהם האמיתיים.
 */
export function InsideBookSection() {
  return (
    <section
      id="inside"
      className="scroll-mt-20 py-24 sm:py-32"
      aria-labelledby="inside-heading"
    >
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
          <Reveal>
            <span className="kicker">
              מה יש בתוך הספר
            </span>
            <h2 id="inside-heading" className="type-h2 mt-4">
              מבנה שקל לזכור, מסלול שקל ליישם
            </h2>

            <ol className="mt-10">
              {preview.tableOfContents.map((chapter, index) => (
                <li
                  key={chapter}
                  className="flex items-baseline gap-4 border-t border-border py-5 last:border-b"
                >
                  <span
                    className="type-quote w-9 shrink-0 text-xl text-brand/70 tabular-nums"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[19px] leading-snug text-foreground">
                    {chapter}
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal className="lg:pt-16">
            <div className="rounded-2xl bg-surface-muted p-8 sm:p-10">
              <h3 className="text-xl font-bold">כלים מעשיים בפנים</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-foreground-muted">
                הספר אינו רק רעיוני, אלה כמה מהכלים שתמצאו בתוכו.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {tools.items.slice(0, 5).map((tool) => (
                  <li key={tool.name} className="flex items-center gap-3">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                      aria-hidden="true"
                    />
                    <span className="text-[17px] font-medium text-foreground">
                      {tool.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
