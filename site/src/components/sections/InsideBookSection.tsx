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
        {/* חשיפה מקובצת אחת לשתי העמודות. */}
        <Reveal className="grid gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
          <div>
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
                    className="type-quote w-9 shrink-0 text-xl text-foreground-muted tabular-nums"
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
          </div>

          <div className="lg:pt-16">
            <div className="rounded-lg border-s-2 border-brand bg-surface-muted/70 py-8 pe-8 ps-6 sm:py-10 sm:pe-10 sm:ps-8">
              <h3 className="font-serif text-xl font-semibold">כלים מעשיים בפנים</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-foreground-muted">
                הספר אינו רק רעיוני, אלה כמה מהכלים שתמצאו בתוכו.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {tools.items.map((tool) => (
                  <li
                    key={tool.name}
                    className="tool-row flex items-center gap-3"
                  >
                    <span
                      className="tool-dot h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                      aria-hidden="true"
                    />
                    <span className="tool-name text-[17px] font-medium text-foreground">
                      {tool.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
