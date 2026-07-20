import Link from "next/link";

import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { closing } from "@/content/book";

export function ClosingSection() {
  return (
    <section className="bg-brand py-16 text-brand-foreground sm:py-20">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <p className="text-balance font-serif text-2xl leading-relaxed sm:text-3xl">
            {closing.title}
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/#purchase">{closing.cta}</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
