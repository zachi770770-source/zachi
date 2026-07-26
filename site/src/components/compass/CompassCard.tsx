import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

import { compass } from "@/content/compass";
import { isCompassFeatureEnabled } from "@/lib/compass/assistant/config";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";

/**
 * כרטיס „המצפן” בעמוד הבית (אחרי הטעימה). מוצג רק כאשר העוזר פעיל בפועל
 * (דגל COMPASS_ASSISTANT_ENABLED). כל עוד הספר האמיתי לא יובא והמפתח לא
 * הוגדר — הכרטיס אינו מופיע, כדי לא להציג את המצפן כפעיל בטרם עת.
 */
export function CompassCard() {
  if (!isCompassFeatureEnabled()) return null;

  return (
    <section className="py-6" aria-labelledby="compass-card-heading">
      <Container>
        <Reveal className="mx-auto flex max-w-3xl flex-col gap-5 rounded-2xl border border-border bg-surface-muted px-8 py-10 text-center sm:text-start">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Compass className="h-7 w-7 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <span className="kicker justify-center sm:justify-start">{compass.card.eyebrow}</span>
              <h2
                id="compass-card-heading"
                className="mt-2 font-serif text-xl font-semibold text-foreground sm:text-2xl"
              >
                {compass.card.title}
              </h2>
              <p className="mt-2 text-[16px] leading-relaxed text-foreground-muted">
                {compass.card.text}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-foreground-muted/90">
                {compass.card.clarification}
              </p>
            </div>
          </div>
          <div className="sm:ps-11">
            <Button asChild size="lg" variant="outline">
              <Link href="/compass">
                {compass.card.cta}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
