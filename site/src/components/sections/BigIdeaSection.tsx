import { Search, Hammer } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { bigIdea } from "@/content/book";

export function BigIdeaSection() {
  return (
    <section
      id="big-idea"
      className="scroll-mt-20 bg-surface-muted py-16 sm:py-24"
      aria-labelledby="big-idea-heading"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-hover">
            הרעיון המרכזי
          </span>
          <h2
            id="big-idea-heading"
            className="mt-3 text-balance font-serif text-4xl font-semibold leading-[1.2] sm:text-5xl"
          >
            {bigIdea.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-foreground-muted">
            {bigIdea.intro}
          </p>
          <p className="mt-3 text-lg leading-relaxed text-foreground-muted">
            {bigIdea.clarification}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          {bigIdea.columns.map((column, index) => {
            const Icon = index === 0 ? Search : Hammer;
            return (
              <div
                key={column.title}
                className="rounded-lg border border-border bg-surface p-7"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-serif text-xl font-semibold">
                    {column.title}
                  </h3>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {column.items.map((item) => (
                    <li
                      key={item}
                      className="text-base leading-relaxed text-foreground-muted"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-base leading-relaxed text-foreground-muted">
          {bigIdea.caveat}
        </p>
      </Container>
    </section>
  );
}
