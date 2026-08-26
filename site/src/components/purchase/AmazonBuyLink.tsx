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
 * - אירוע אנונימי `amazon_purchase_clicked` (ההמרה העסקית המרכזית: קליק-כוונה
 *   יוצא, לא מכירה מאושרת), fire-and-forget ולא-חוסם — לעולם לא אימייל/תוכן אישי.
 *   נושא מימדי-שיוך בלבד: `source`/`cta_location` (היכן נלחץ), `source_detail`
 *   (שיוך משני, למשל slug מדריך), `page_path` (העמוד ממנו יצא הקליק),
 *   `destination_url` (יעד אמזון), ו-`book_format` (kindle). כך אפשר למדוד
 *   traffic → landing → engagement → Amazon click לפי עמוד ומיקום-CTA.
 */
export type AmazonSource =
  | "home"
  | "book"
  | "preview"
  | "guide"
  | "journey_before"
  | "journey_building"
  | "journey_inside"
  | "journey_after"
  | "journey_starting";

export function AmazonBuyLink({
  source,
  sourceDetail,
  className,
  children,
  ...rest
}: {
  source: AmazonSource;
  /**
   * שיוך משני, למשל ה-slug של המדריך שממנו הגיע הקליק (guide). מזהה בלבד —
   * לעולם לא PII. נשלח כפרמטר `source_detail` על אותו אירוע `amazon_purchase_clicked`.
   */
  sourceDetail?: string;
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
          trackEvent("amazon_purchase_clicked", {
            // מיקום ה-CTA — `source` נשמר לתאימות, `cta_location` הוא השם המפורש.
            source,
            cta_location: source,
            ...(sourceDetail ? { source_detail: sourceDetail } : {}),
            // מימדי-שיוך נוספים (ללא PII): העמוד, היעד, והפורמט.
            page_path:
              typeof window !== "undefined" ? window.location.pathname : "",
            destination_url: siteConfig.amazon.url,
            book_format: siteConfig.amazon.format,
          });
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
