import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";

/**
 * מסלול ברור מהשער (עמוד הבית) אל עמוד הספר המלא /book — שם מרוכזים
 * השיטה, מבנה הספר, הכלים והתוצאות. פס קישור קצר, לא סקשן תוכן.
 */
export function BookHubLink() {
  return (
    <section className="py-6" aria-label="מעבר לעמוד הספר המלא">
      <Container>
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-2xl border border-border bg-surface-muted px-8 py-10 text-center sm:flex-row sm:justify-between sm:text-start">
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
              רוצים להעמיק לפני שמחליטים?
            </h2>
            <p className="mt-2 text-[16px] leading-relaxed text-foreground-muted">
              השיטה, מבנה הספר, הכלים המעשיים ומה משתנה אחרי הקריאה, בעמוד אחד.
            </p>
          </div>
          <Button asChild size="lg" variant="outline" className="shrink-0">
            <Link href="/book">
              לעמוד הספר המלא
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
