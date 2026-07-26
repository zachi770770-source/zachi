import type { Metadata } from "next";

import { stations } from "@/content/stations";
import { StationPage } from "@/components/stations/StationPage";

const station = stations["starting-again"];

export const metadata: Metadata = {
  title: station.metaTitle,
  description: station.metaDescription,
  alternates: { canonical: `/${station.id}` },
  openGraph: {
    type: "article",
    locale: "he_IL",
    url: `/${station.id}`,
    title: station.metaTitle,
    description: station.metaDescription,
  },
};

export default function StartingAgainPage() {
  return <StationPage station={station} />;
}
