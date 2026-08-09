import { stations } from "@/content/stations";
import { journeyPages } from "@/content/journeyPages";
import { pageMetadata } from "@/lib/seo";
import { JourneyPage } from "@/components/journey/JourneyPage";

const station = stations["before-relationship"];

export const metadata = pageMetadata({
  title: station.metaTitle,
  description: station.metaDescription,
  path: `/${station.id}`,
  ogType: "article",
  absoluteTitle: true,
});

export default function StationRoutePage() {
  return <JourneyPage journey={journeyPages["before-relationship"]} />;
}
