import type { Metadata } from "next";
import "../globals.css";
import { siteConfig } from "@/config/site";
import { SiteDocument } from "@/components/layout/SiteDocument";

/**
 * ה-root layout האנגלי — ‎/en בלבד.
 *
 * זו כל מטרת הפיצול: עמוד המהדורה האנגלית מוגש עכשיו עם
 * `<html lang="en" dir="ltr">` **ב-HTML הראשוני**, ולא כתיקון של סקריפט
 * חוסם אחרי שהשרת כבר הכריז he/rtl. סורקים, קוראי-מסך ותרגום-דפדפן קוראים
 * את ההכרזה הנכונה, וגם ללא JS העמוד נכון.
 */

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  robots:
    process.env.VERCEL_ENV === "production"
      ? { index: true, follow: true }
      : { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.englishEdition.title,
  },
};

export const viewport = {
  themeColor: "#f6f0e7", // = --color-background (כרום-הדפדפן באותו נייר חמים)
};

export default function EnglishRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SiteDocument lang="en" dir="ltr">
      {children}
    </SiteDocument>
  );
}
