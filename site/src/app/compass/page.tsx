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
    <Container className="py-12 sm:py-16 lg:py-20">
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "המצפן", path: "/compass" },
        ]}
      />

      <header className="mx-auto max-w-2xl text-center">
        <span className="kicker justify-center">{compass.page.eyebrow}</span>
        <h1 className="mt-4 font-serif text-[clamp(1.9rem,4vw,2.7rem)] font-semibold leading-[1.15] text-foreground">
          {compass.page.title}
        </h1>
        <p className="mt-5 text-[clamp(1.05rem,1.6vw,1.25rem)] leading-relaxed text-foreground-muted">
          {compass.page.lead}
        </p>
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
