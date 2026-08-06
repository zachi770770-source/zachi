import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";

const AVAILABILITY_MAP: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  preorder: "https://schema.org/PreOrder",
  out_of_stock: "https://schema.org/OutOfStock",
};

/**
 * Product structured data — נתונים אמיתיים בלבד. אין דירוגים, ביקורות או
 * זמינות מומצאים. לפני פתיחת המכירה (`salesOpen=false`) אין כאן כלל בלוק
 * Product/Offer: הספר עדיין אינו למכירה, ולכן אין להציג סימון מוצר/מחיר/זמינות
 * שאי אפשר לממש. זהות הספר לפני ההשקה מיוצגת דרך BookSchema (@type Book).
 * רק כשהמכירה נפתחת נוצר Product עם ההצעה, המחיר והזמינות האמיתיים.
 */
export function ProductSchema() {
  if (!siteConfig.salesOpen) {
    return null;
  }

  const base = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: siteConfig.bookTitle,
    description: siteConfig.description,
    image: `${siteConfig.url}${siteConfig.images.cover}`,
    category: "ספר דיגיטלי",
    brand: { "@type": "Brand", name: siteConfig.bookTitle },
  } as const;

  return (
    <JsonLd
      data={{
        ...base,
        offers: {
          "@type": "Offer",
          url: `${siteConfig.url}/book#purchase`,
          priceCurrency: siteConfig.commerce.currency,
          price: siteConfig.commerce.price,
          availability:
            AVAILABILITY_MAP[siteConfig.commerce.availability] ??
            "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      }}
    />
  );
}
