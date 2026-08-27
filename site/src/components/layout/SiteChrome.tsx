"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * „קליפת האתר” השיווקית (הדר/פוטר/בר-רכישה/בועת-מצפן/באנר-הסכמה) עוטפת את כל
 * העמודים הציבוריים — אך *לא* את לוח-הבקרה הניהולי. /admin הוא כלי פנימי נקי,
 * בלי ניווט-שיווקי, „לרכישת הספר” או בועת-מצפן. גייט קטן בצד-הלקוח שמסתיר את
 * הקליפה תחת /admin (כולל בזמן SSR — usePathname מחזיר את הנתיב, אין הבהוב).
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
