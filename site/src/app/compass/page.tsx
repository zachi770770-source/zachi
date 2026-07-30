import { Compass } from "lucide-react";

import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { compass } from "@/content/compass";
import { COMPASS_LIMITS, isCompassFeatureEnabled } from "@/lib/compass/assistant/config";
import { Container } from "@/components/shared/Container";
import { CompassConsole } from "@/components/compass/CompassConsole";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

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
    <Container className="py-9 sm:py-12 lg:py-14">
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "המצפן", path: "/compass" },
        ]}
      />

      <header className="mx-auto max-w-xl text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-muted text-brand"
          aria-hidden="true"
        >
          <Compass className="h-5 w-5" />
        </span>
        <span className="kicker mt-5 justify-center">{compass.page.eyebrow}</span>
        <h1 className="mt-3 font-serif text-[clamp(1.75rem,3.6vw,2.4rem)] font-semibold leading-[1.15] text-balance text-foreground">
          {compass.page.title}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[clamp(1.02rem,1.5vw,1.18rem)] leading-relaxed text-balance text-foreground-muted">
          {compass.page.lead}
        </p>
      </header>

      <div className="mt-8 sm:mt-10">
        <CompassConsole
          salesOpen={siteConfig.salesOpen}
          maxQuestionChars={COMPASS_LIMITS.maxQuestionChars}
        />
      </div>
    </Container>
  );
}
