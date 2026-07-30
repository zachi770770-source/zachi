import { Compass } from "lucide-react";

import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { compass } from "@/content/compass";
import { COMPASS_LIMITS, isCompassFeatureEnabled } from "@/lib/compass/assistant/config";
import { Container } from "@/components/shared/Container";
import { CompassConsole } from "@/components/compass/CompassConsole";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

const openingPoints = compass.signature.points;

export const metadata = {
  ...pageMetadata({
    title: "המצפן של מדייטים לאהבה",
    description:
      "שאלו מספר שאלות ממוקדות וקבלו כיוון קצר המבוסס על עקרונות הספר מדייטים לאהבה. טעימה מהגישה, לא תחליף לקריאת הספר.",
    path: "/compass",
    ogType: "article",
  }),
  // כל עוד המצפן אינו פעיל — noindex,nofollow, כדי שלא ייכנס לאינדוקס בטרם עת.
  ...(isCompassFeatureEnabled() ? {} : { robots: { index: false, follow: false } }),
};

/**
 * עמוד „המצפן”. העמוד קיים תמיד; הזמינות בפועל (ספק מודל + גרסת ספר פעילה)
 * נקבעת בזמן ריצה ומוצגת ע"י הרכיב — כשאינו פעיל מוצג „בקרוב” מכובד, בלי
 * שום תוכן פיקצ׳ר.
 */
export default function CompassPage() {
  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "המצפן", path: "/compass" },
        ]}
      />

      <header className="mx-auto max-w-2xl text-center">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-muted text-brand ring-1 ring-brand/15"
          aria-hidden="true"
        >
          <Compass className="h-6 w-6" />
        </span>
        <span className="kicker mt-6 justify-center">{compass.page.eyebrow}</span>
        <h1 className="mt-4 font-serif text-[clamp(2rem,4.2vw,2.85rem)] font-semibold leading-[1.1] text-balance text-foreground">
          {compass.page.title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[clamp(1.05rem,1.5vw,1.2rem)] leading-relaxed text-balance text-foreground-muted">
          {compass.page.lead}
        </p>

        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {openingPoints.map((point) => (
            <li
              key={point}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13.5px] font-medium text-foreground-muted"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
              {point}
            </li>
          ))}
        </ul>
      </header>

      <div className="mt-10 sm:mt-12">
        <CompassConsole
          salesOpen={siteConfig.salesOpen}
          maxQuestionChars={COMPASS_LIMITS.maxQuestionChars}
        />
      </div>
    </Container>
  );
}
