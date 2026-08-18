import { stations } from "@/content/stations";
import { journeyPages } from "@/content/journeyPages";
import { pageMetadata } from "@/lib/seo";
import { JourneyPage } from "@/components/journey/JourneyPage";

// מטא-דאטה ייחודי נשמר מתוכן התחנה (SEO), אך העמוד מוצג כעת בחוויית ה-JourneyPage
// העשירה — בפָּריטי מלא עם ארבע התחנות האחיות (שיקוף, עומק, רגע של מראה, טעימה
// מותאמת ו-CTA), ולא במבנה ה-StationPage הדק.
const station = stations["starting-again"];

export const metadata = pageMetadata({
  title: station.metaTitle,
  description: station.metaDescription,
  path: `/${station.id}`,
  ogType: "article",
  absoluteTitle: true,
});

export default function StartingAgainRoutePage() {
  return <JourneyPage journey={journeyPages["starting-again"]} />;
}
