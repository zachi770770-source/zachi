import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";

const AVAILABILITY_MAP: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  preorder: "https://schema.org/PreOrder",
  out_of_stock: "https://schema.org/OutOfStock",
};

/**
 * Product structured data — נתונים אמיתיים בלבד. אין דירוגים, ביקורות
 * או זמינות מומצאים. כל עוד המכירה סגורה (`salesOpen=false`) אין הצעת
 * מכר פעילה, ולכן לא נוצר בלוק `offers` עם זמינות/מחיר שאי אפשר לרכוש
 * בפועל — רק כשהמכירה נפתחת מתווספת ההצעה עם המחיר והזמינות האמיתיים.
 */
export function ProductSchema() {
  const base = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: siteConfig.bookTitle,
    description: siteConfig.description,
    image: `${siteConfig.url}${siteConfig.images.cover}`,
    category: "ספר דיגיטלי",
    brand: { "@type": "Brand", name: siteConfig.bookTitle },
  } as const;

  if (!siteConfig.salesOpen) {
    return <JsonLd data={base} />;
  }

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
