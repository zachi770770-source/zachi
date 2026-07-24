import Image from "next/image";
import { Gift, Check } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { Badge } from "@/components/ui/badge";

export function BonusSection() {
  if (!siteConfig.features.bonusSection || !siteConfig.bonus.enabled) {
    return null;
  }

  const { bonus } = siteConfig;

  return (
    <section className="py-16 sm:py-24" aria-labelledby="bonus-heading">
      <Container>
        <div className="mx-auto grid max-w-4xl items-center gap-10 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2 sm:p-10">
          <div className="order-2 flex justify-center sm:order-1">
            <Image
              src={siteConfig.images.workbookMockup}
              alt={siteConfig.images.workbookMockupAlt}
              width={600}
              height={780}
              unoptimized
              className="h-auto w-full max-w-[260px] rounded-lg shadow-lg"
            />
          </div>

          <div className="order-1 flex flex-col gap-4 sm:order-2">
            <Badge className="w-fit">
              <Gift className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
              בונוס דיגיטלי
            </Badge>
            <h2
              id="bonus-heading"
              className="text-balance font-serif text-2xl font-semibold sm:text-3xl"
            >
              {bonus.title}
            </h2>

            <ul className="flex flex-col gap-2.5 text-base text-foreground-muted">
              <li className="flex items-start gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                {bonus.includedInPrice
                  ? "כלולה במחיר הספר, ללא תוספת תשלום."
                  : "מוצעת בנפרד מרכישת הספר."}
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                {bonus.format}
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                {bonus.deliveryTiming}
              </li>
              {bonus.personalUseOnly ? (
                <li className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                  מיועדת לשימוש אישי בלבד.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
