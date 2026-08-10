"use client";

import * as React from "react";

import { siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

/**
 * קישור הרכישה החיצוני היחיד באתר — אל עמוד המוצר ב-Amazon (מקור האמת:
 * `siteConfig.amazon.url`). הרכישה מתבצעת בפלטפורמת Amazon, לא באתר.
 *
 * עקרונות:
 * - קישור נטיבי (`<a href>`) עם `target="_blank"` + `rel="noopener noreferrer"`.
 *   הניווט לעולם אינו תלוי ב-JS: אין `preventDefault`, אין `router.push`.
 * - אירוע אנונימי `amazon_purchase_clicked` עם *מקור בלבד* (home/book/preview/
 *   journey_*), fire-and-forget ולא-חוסם — לעולם לא אימייל/תוכן אישי.
 */
export type AmazonSource =
  | "home"
  | "book"
  | "preview"
  | "journey_before"
  | "journey_building"
  | "journey_inside"
  | "journey_after";

export function AmazonBuyLink({
  source,
  className,
  children,
  ...rest
}: {
  source: AmazonSource;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick" | "children">) {
  return (
    <a
      href={siteConfig.amazon.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // לא-חוסם: לעולם לא לעצור/להפריע לטאפ; שגיאה באנליטיקה לא תבטל ניווט.
        try {
          trackEvent("amazon_purchase_clicked", { source });
        } catch {
          /* analytics לא קריטי */
        }
      }}
      className={className}
      {...rest}
    >
      {children ?? siteConfig.amazon.buyLabel}
    </a>
  );
}
