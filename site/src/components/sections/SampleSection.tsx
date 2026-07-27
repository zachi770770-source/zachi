import Link from "next/link";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { preview } from "@/content/book";

/**
 * טיזר טעימה קצר לשער הבית: שתי שורות מתוך הקטע (מילה במילה) וכפתור ברור
 * לעמוד ההצצה המלא. הקטע המלא, תוכן העניינים וההורדה חיים ב-/preview בלבד,
 * בלי כפילות כאן.
 */
export function SampleSection() {
  return (
    <section
      id="sample"
      className="scroll-mt-20 bg-surface-muted py-14 sm:py-16"
      aria-labelledby="sample-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">טעימה מהספר</span>
          <h2 id="sample-heading" className="type-h2 mt-4">
            כמה שורות, כדי שתדעו לאן אתם נכנסים
          </h2>
          <p className="type-quote mx-auto mt-6 max-w-[44ch] text-[19px] leading-[1.7] text-foreground/85">
            {preview.homeTeaser}
          </p>
          <div className="mt-8">
            <Button asChild size="lg" variant="outline">
              <Link href="/preview">לקריאת טעימה מהספר</Link>
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
