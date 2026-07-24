import { Container } from "@/components/shared/Container";
import { problem } from "@/content/book";

export function ProblemSection() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="problem-heading">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2
            id="problem-heading"
            className="text-balance text-center font-serif text-3xl font-semibold leading-snug sm:text-4xl"
          >
            {problem.title}
          </h2>

          <ul className="mx-auto mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {problem.situations.map((situation) => (
              <li
                key={situation}
                className="flex gap-3 border-t border-border pt-4 text-base leading-relaxed text-foreground-muted"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                  aria-hidden="true"
                />
                {situation}
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-10 max-w-2xl text-center text-lg leading-relaxed text-foreground-muted">
            {problem.closing}
          </p>
        </div>
      </Container>
    </section>
  );
}
