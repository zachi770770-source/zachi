import type { Metadata } from "next";
import "../globals.css";
import { siteConfig } from "@/config/site";
import { SiteDocument } from "@/components/layout/SiteDocument";

/**
 * ה-root layout העברי — כל האתר מלבד ‎/en.
 *
 * ראו `SiteDocument` להסבר מלא על הפיצול לשני root layouts. בקצרה: קבוצת
 * המסלולים `(he)` אינה מופיעה בשום URL, ולכן אף כתובת לא השתנתה; מה שהשתנה
 * הוא שה-HTML שהשרת שולח מכריז `lang="he" dir="rtl"` בזכות עצמו, במקום
 * להיקבע לכולם ואז להיות מתוקן בסקריפט.
 */

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.bookTitle} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.bookTitle}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.bookTitle,
  authors: [{ name: siteConfig.author.name }],
  creator: siteConfig.author.name,
  alternates: {
    canonical: "/",
  },
  // אינדוקס רק בפרודקשן. כל דיפלוי אחר (Preview/Development ב-Vercel) מקבל
  // noindex,nofollow כדי שלא יתחרה בפרודקשן על אותות אינדוקס. נקבע לפי
  // VERCEL_ENV (NODE_ENV אינו מבחין בין preview לפרודקשן ב-build).
  robots:
    process.env.VERCEL_ENV === "production"
      ? { index: true, follow: true }
      : { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: siteConfig.url,
    siteName: siteConfig.bookTitle,
    title: `${siteConfig.bookTitle} | ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.bookTitle} | ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
};

export const viewport = {
  themeColor: "#f6f0e7", // = --color-background (כרום-הדפדפן באותו נייר חמים)
};

export default function HebrewRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SiteDocument lang="he" dir="rtl">
      {children}
    </SiteDocument>
  );
}
