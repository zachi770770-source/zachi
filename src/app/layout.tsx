import type { Metadata, Viewport } from "next";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { SafetyStrip } from "@/components/layout/SafetyStrip";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const frank = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  variable: "--font-frank",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "מדייטים לאהבה",
  description: "דייטינג הוא חיפוש; אהבה היא בנייה. אפליקציית התפתחות אישית בתחום הזוגיות, מבוססת על הספר של צחי חן.",
  applicationName: "מדייטים לאהבה",
  authors: [{ name: "צחי חן" }],
  keywords: ["זוגיות", "אהבה", "דייטינג", "פיתוח אישי", "צחי חן"],
  openGraph: {
    title: "מדייטים לאהבה",
    description: "אהבה לא מוצאים. בונים.",
    locale: "he_IL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${frank.variable}`}>
      <body className="min-h-screen bg-sand-50 text-ink-700 font-sans">
        <div className="mx-auto max-w-2xl pb-28 min-h-screen">
          {children}
        </div>
        <BottomNav />
        <SafetyStrip />
      </body>
    </html>
  );
}
