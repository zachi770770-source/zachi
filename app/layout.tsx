import type { Metadata } from "next";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

const sans = Heebo({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const display = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "מדייטים לאהבה — אפליקציה אישית למוכנות ובניית קשר",
  description:
    "אפליקציה אישית לזיהוי מוכנות, דפוסים ובניית קשר נכון, מבוססת על הספר והשיטה ׳מדייטים לאהבה׳.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans bg-cream-100 text-ink-900 min-h-screen flex flex-col">
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
