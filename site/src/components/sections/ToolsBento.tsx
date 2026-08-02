import { ArrowLeft } from "lucide-react";

import { tools } from "@/content/book";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { BookLink } from "@/components/shared/BookLink";

/**
 * „הכלים המעשיים” — בנטו עריכתי של ששת הכלים האמיתיים מהספר (src/content/book.ts).
 * מבנה מגוון ונקי: שני כלים „מובילים” רחבים (Sage) וארבעה תאים רגילים, בלי תאים
 * ריקים בשום רזולוציה. תצוגה בלבד; הפעולה הנגישה (מקלדת/מגע) היא קישור אחד לעמוד
 * הספר. חשיפת Reveal עדינה בלבד (fade-up), ללא אנימציה חדשה. שפת Ink/Ivory/
 * Sage/Terracotta הקיימת.
 */
export function ToolsBento() {
  const items = tools.items.slice(0, 6);
  // אינדקסים של התאים ה„מובילים” (רחבים + גוון Sage) — הראשון והאחרון.
  const feature = new Set([0, items.length - 1]);

  return (
    <section
      id="tools"
      className="scroll-mt-20 py-16 sm:py-20"
      aria-labelledby="tools-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">כלים, לא רק רעיון</span>
          <h2 id="tools-heading" className="type-h2 mt-4">
            {tools.title}
          </h2>
          <p className="type-lead mt-4 text-foreground-muted">{tools.description}</p>
        </Reveal>

        <Reveal className="mx-auto mt-10 grid max-w-5xl gap-3.5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((tool, i) => {
            const wide = feature.has(i);
            return (
              <div
                key={tool.name}
                className={`group flex flex-col rounded-2xl border p-5 transition-colors sm:p-6 ${
                  wide ? "sm:col-span-2 border-secondary/40 bg-secondary-muted/60" : "border-border bg-surface"
                } ${wide ? "" : "hover:border-brand/40 hover:bg-surface-muted"}`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted font-quote text-[14px] font-bold text-brand-hover tabular-nums transition-transform group-hover:scale-110"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className={`mt-4 font-serif font-semibold leading-snug text-foreground ${
                    wide ? "text-[1.3rem]" : "text-[1.12rem]"
                  }`}
                >
                  {tool.name}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                  {tool.description}
                </p>
              </div>
            );
          })}
        </Reveal>

        <Reveal className="mt-9 flex justify-center">
          <Button asChild size="lg" variant="outline">
            <BookLink href="/book">
              לשיטה ולכלים המלאים בספר
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </BookLink>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
