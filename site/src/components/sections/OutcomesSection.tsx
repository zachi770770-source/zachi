import { CheckCircle2 } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { outcomes } from "@/content/book";

export function OutcomesSection() {
  return (
    <section className="bg-surface-muted py-16 sm:py-24" aria-labelledby="outcomes-heading">
      <Container>
        <SectionHeading title={outcomes.title} headingId="outcomes-heading" />

        <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          {outcomes.items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-lg bg-surface p-5 shadow-sm"
            >
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-secondary"
                aria-hidden="true"
              />
              <span className="text-base leading-relaxed text-foreground">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
