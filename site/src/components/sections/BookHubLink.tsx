import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/shared/BookCover";
import { BookLink } from "@/components/shared/BookLink";
import { tools } from "@/content/book";

/**
 * „מה נותן הספר” — הגרסה המזוקקת של הערך המעשי: שיטה בת שלושה שלבים וכלים
 * לשימוש חוזר, עם שלושה שמות כלים מאומתים כהוכחה שזה ספר מעשי ולא רק רעיון.
 * הפירוט המלא (השיטה, מבנה הספר, כל הכלים והתוצאות) חי ב-/book — לא משוכפל כאן.
 */
export function BookHubLink() {
  return (
    <section className="py-14 sm:py-20" aria-labelledby="bookvalue-heading">
      <Container>
        <Reveal className="mx-auto flex max-w-3xl flex-col gap-6 border-y border-border py-9 text-start sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <div className="border-s-2 border-brand ps-5">
            <h2
              id="bookvalue-heading"
              className="font-serif text-xl font-semibold text-foreground sm:text-2xl"
            >
              מה תמצאו בספר
            </h2>
            <p className="mt-2 max-w-md text-[16px] leading-relaxed text-foreground-muted">
              שיטה מעשית בת שלושה שלבים וכלים לשימוש חוזר בכל תחנה בקשר — לא רק רעיון.
            </p>
            <ul
              className="mt-4 flex flex-wrap gap-2"
              aria-label="דוגמאות לכלים מעשיים מהספר"
            >
              {tools.items.slice(0, 3).map((tool) => (
                <li
                  key={tool.name}
                  className="rounded-full border border-border-strong bg-surface px-3 py-1 text-[13.5px] font-medium text-foreground-muted"
                >
                  {tool.name}
                </li>
              ))}
            </ul>
          </div>
          {/* עטיפה קטנה + כפתור: נקודת המקור של „כניסה לספר”. בלחיצה, העטיפה
              נמשכת ומשתנה גודל אל עטיפת עמוד הספר. */}
          <div className="flex shrink-0 flex-col items-center gap-4">
            <div data-vt-book-source className="w-[76px]">
              <BookCover />
            </div>
            <Button asChild size="lg" variant="outline">
              <BookLink href="/book" morphCover>
                לעמוד הספר המלא
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </BookLink>
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
