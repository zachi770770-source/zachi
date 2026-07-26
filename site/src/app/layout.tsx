import type { Metadata } from "next";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyPurchaseBar } from "@/components/layout/StickyPurchaseBar";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";

/**
 * Heebo משמש לממשק, לגוף ולכותרות המרכזיות.
 * Noto Serif Hebrew שמור אך ורק לציטוט/משפט התזה המרכזי.
 */
const bodyFont = Heebo({
  variable: "--font-body",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const quoteFont = Frank_Ruhl_Libre({
  variable: "--font-quote",
  subsets: ["hebrew", "latin"],
  weight: ["500", "700", "800", "900"],
  display: "swap",
});

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
  keywords: [
    "מדייטים לאהבה",
    "ספר על זוגיות",
    "ספר על דייטים",
    "איך לבנות זוגיות",
    "ספר על מציאת אהבה",
    "פחד ממחויבות",
    "איך לדעת אם קשר מתאים",
    "דייטינג אחרי גירושים",
    "להתחיל מחדש אחרי פרידה",
    "איך לשמור על זוגיות",
    "להעמיק את הזוגיות",
    "בנייה של קשר זוגי",
  ],
  alternates: {
    canonical: "/",
  },
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
  themeColor: "#fbf8f3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${bodyFont.variable} ${quoteFont.variable}`}
    >
      <body className="flex min-h-svh flex-col bg-background text-foreground antialiased">
        <SkipToContent />
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <StickyPurchaseBar />
        <CookieConsent />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
