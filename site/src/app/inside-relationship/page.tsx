import type { Metadata } from "next";

import { stations } from "@/content/stations";
import { StationPage } from "@/components/stations/StationPage";

const station = stations["inside-relationship"];

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

export default function InsideRelationshipPage() {
  return <StationPage station={station} />;
}
