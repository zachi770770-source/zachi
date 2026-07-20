import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";

export function PersonSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Person",
        name: siteConfig.author.name,
        description: siteConfig.author.shortBio,
        url: `${siteConfig.url}/author`,
      }}
    />
  );
}
