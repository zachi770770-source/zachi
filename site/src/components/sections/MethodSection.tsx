import Link from "next/link";
import { Eye, KeyRound, Sprout, ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { method } from "@/content/book";

const ICONS = [Eye, KeyRound, Sprout];

export function MethodSection() {
  return (
    <section
      id="method"
      className="scroll-mt-20 py-16 sm:py-24"
      aria-labelledby="method-heading"
    >
      <Container>
        <SectionHeading
          eyebrow="השיטה"
          title={method.title}
          description={method.description}
          headingId="method-heading"
        />

        <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {method.steps.map((step, index) => {
            const Icon = ICONS[index];
            return (
              <li
                key={step.number}
                className="relative flex flex-col gap-3 bg-surface p-7 pt-6"
              >
                <span
                  className="pointer-events-none absolute -top-2 start-6 font-serif text-7xl font-semibold text-border-strong/60"
                  aria-hidden="true"
                >
                  {step.number}
                </span>
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-serif text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-foreground-muted">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 text-center">
          <Link
            href="/preview"
            className="inline-flex items-center gap-2 text-base font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {method.linkLabel}
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
