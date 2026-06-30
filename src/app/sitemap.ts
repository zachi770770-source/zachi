import type { MetadataRoute } from "next";
import { STATIONS } from "@/content/stations";
import { TOOLS } from "@/content/tools";

const BASE = "https://zachi.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths = [
    "",
    "/onboarding",
    "/diagnosis",
    "/tools",
    "/learn",
    "/coach",
    "/progress",
    "/about",
    "/safety",
    "/emergency",
    "/pricing",
    "/auth/sign-in",
  ];

  const stationPaths = STATIONS.map((s) => `/learn/${s.slug}`);
  stationPaths.push("/learn/healthy");
  const toolPaths = TOOLS.map((t) => `/tools/${t.slug}`);

  return [...staticPaths, ...stationPaths, ...toolPaths].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.6,
  }));
}
