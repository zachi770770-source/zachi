import { pageMetadata } from "@/lib/seo";
import { guides } from "@/content/guides";
import { GuidePage } from "@/components/guides/GuidePage";

const guide = guides["how-fast-is-too-fast"];

export const metadata = pageMetadata({
  title: guide.metaTitle,
  description: guide.metaDescription,
  path: guide.path,
  ogType: "article",
});

export default function Page() {
  return <GuidePage guide={guide} />;
}
