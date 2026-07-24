import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";

const AVAILABILITY_MAP: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  preorder: "https://schema.org/PreOrder",
  out_of_stock: "https://schema.org/OutOfStock",
};

export function ProductSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: siteConfig.bookTitle,
        description: siteConfig.description,
        image: `${siteConfig.url}${siteConfig.images.cover}`,
        offers: {
          "@type": "Offer",
          url: `${siteConfig.url}/#purchase`,
          priceCurrency: siteConfig.commerce.currency,
          price: siteConfig.commerce.price,
          availability:
            AVAILABILITY_MAP[siteConfig.commerce.availability] ??
            "https://schema.org/InStock",
        },
      }}
    />
  );
}
