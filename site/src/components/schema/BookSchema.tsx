import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";

export function BookSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Book",
        name: siteConfig.bookTitle,
        description: siteConfig.description,
        inLanguage: "he",
        bookFormat: "https://schema.org/Paperback",
        image: `${siteConfig.url}${siteConfig.images.cover}`,
        url: siteConfig.url,
        author: {
          "@type": "Person",
          name: siteConfig.author.name,
        },
      }}
    />
  );
}
