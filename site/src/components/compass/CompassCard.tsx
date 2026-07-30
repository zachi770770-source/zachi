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
        <Reveal className="mx-auto flex max-w-3xl flex-col gap-6 border-y border-border py-9 text-start sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <div className="flex items-start gap-4">
            <span
              className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand"
              aria-hidden="true"
            >
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <span className="kicker">{compass.card.eyebrow}</span>
              <h2
                id="compass-card-heading"
                className="mt-2 font-serif text-xl font-semibold text-foreground sm:text-2xl"
              >
                {compass.card.title}
              </h2>
              <p className="mt-2 text-[16px] leading-relaxed text-foreground-muted">
                {compass.card.text}
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-foreground-muted/90">
                {compass.card.clarification}
              </p>
            </div>
          </div>
          <Button asChild size="lg" variant="outline" className="shrink-0">
            <Link href="/compass">
              {compass.card.cta}
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
