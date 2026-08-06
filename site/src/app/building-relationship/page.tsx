import { stations } from "@/content/stations";
import { pageMetadata } from "@/lib/seo";
import { StationPage } from "@/components/stations/StationPage";

const station = stations["building-relationship"];

export const metadata = pageMetadata({
  title: station.metaTitle,
  description: station.metaDescription,
  path: `/${station.id}`,
  ogType: "article",
  absoluteTitle: true,
});

export default function StationRoutePage() {
  return <StationPage station={station} />;
}
