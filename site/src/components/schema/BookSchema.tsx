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
        bookFormat: "https://schema.org/EBook",
        image: `${siteConfig.url}${siteConfig.images.cover}`,
        url: siteConfig.url,
        author: {
          "@type": "Person",
          name: siteConfig.author.name,
        },
        // הספר זמין לרכישה במהדורת Kindle באמזון. ללא מחיר מומצא — מציינים
        // רק זמינות וכתובת המוצר החיצונית (מקור: siteConfig.amazon).
        ...(siteConfig.amazon.available
          ? {
              sameAs: siteConfig.amazon.url,
              offers: {
                "@type": "Offer",
                availability: "https://schema.org/InStock",
                url: siteConfig.amazon.url,
              },
            }
          : {}),
      }}
    />
  );
}
