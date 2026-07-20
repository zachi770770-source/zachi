import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${siteConfig.url}${item.path}`,
        })),
      }}
    />
  );
}
