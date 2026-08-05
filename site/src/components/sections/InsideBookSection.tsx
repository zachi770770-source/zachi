import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { preview } from "@/content/book";

/**
 * "מה יש בתוך הספר" - תוכן עניינים בסגנון עריכתי (לא רשת תיבות). ששת הכלים
 * המעשיים מוצגים פעם אחת בלבד, בבנטו האינטראקטיבי (ToolsBento), ולכן אינם
 * משוכפלים כאן.
 */
export function InsideBookSection() {
  return (
    <section
      id="inside"
      className="scroll-mt-20 py-24 sm:py-32"
      aria-labelledby="inside-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl">
          <span className="kicker">מה יש בתוך הספר</span>
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
        </Reveal>
      </Container>
    </section>
  );
}
