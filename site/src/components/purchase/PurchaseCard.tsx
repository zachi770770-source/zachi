"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { FileText, Download, Smartphone, Package, ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import type { ProductFormat } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { BookLink } from "@/components/shared/BookLink";
import { FormatSelector } from "@/components/purchase/FormatSelector";

/**
 * מצב Pre-launch: האתר ציבורי אך המכירה סגורה. אין מעבר ל-checkout ואין
 * תשלום. כל עוד המכירה סגורה *אין בורר מהדורות ואין כרטיסי „מודפס”/„דיגיטלי+
 * מודפס”* — רק המהדורה הדיגיטלית מוצגת עובדתית, עם מחיר-השקה, עובדות מאומתות,
 * פעולה אחת („קבלו עדכון כשהספר יוצא”) ופעולה משנית לטעימה. כאשר salesOpen
 * יופעל, חוזר בורר המהדורות וזרימת הרכישה הפעילה.
 */
export function PurchaseCard() {
  const [format, setFormat] = React.useState<ProductFormat>(
    siteConfig.products.defaultFormat
  );
  const salesOpen = siteConfig.salesOpen;

  return (
    <div
      id="purchase"
      className="scroll-mt-24 overflow-hidden rounded-lg border border-border-strong bg-surface"
    >
      <div className="grid sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="order-2 flex flex-col gap-6 p-8 sm:order-1 sm:p-10">
          <div>
            <h3 className="type-quote text-[26px] font-bold text-foreground">
              {siteConfig.bookTitle}
            </h3>
            <p className="mt-1 text-[15px] text-foreground-muted">
              מאת צחי חן · {salesOpen ? "המהדורה הדיגיטלית" : "המכירה תיפתח בקרוב"}
            </p>
          </div>

          {/* בורר מהדורות מוצג רק כשהמכירה פתוחה — בטרום-השקה אין בחירת מהדורה. */}
          {salesOpen ? <FormatSelector value={format} onChange={setFormat} /> : null}

          <div className="border-t border-foreground/12 pt-5">
            <p className="type-quote text-[26px] font-bold text-brand-hover">
              {siteConfig.preLaunchPriceLabel}
            </p>
          </div>

          <ul className="flex flex-col gap-2.5 text-[15px] text-foreground-muted">
            <li className="flex items-center gap-2.5">
              <FileText className="h-[18px] w-[18px] text-brand" aria-hidden="true" />
              קובץ דיגיטלי לקריאה עצמית
            </li>
            <li className="flex items-center gap-2.5">
              <Download className="h-[18px] w-[18px] text-brand" aria-hidden="true" />
              {siteConfig.digital.deliveryMethod}
            </li>
            <li className="flex items-center gap-2.5">
              <Smartphone className="h-[18px] w-[18px] text-brand" aria-hidden="true" />
              קריאה ב{siteConfig.digital.devices}
            </li>
            {siteConfig.bonus.enabled && siteConfig.bonus.includedInPrice ? (
              <li className="flex items-center gap-2.5">
                <Package className="h-[18px] w-[18px] text-brand" aria-hidden="true" />
                כולל חוברת עבודה דיגיטלית
              </li>
            ) : null}
          </ul>

          <Button asChild size="lg" className="h-14 w-full text-[17px]">
            <Link href={salesOpen ? "/checkout" : "/#waitlist"}>
              {salesOpen ? "לרכישת הספר" : "קבלו עדכון כשהספר יוצא"}
            </Link>
          </Button>

          {/* פעולה משנית שקטה בטרום-השקה: טעימה מהספר (אותו מונח אחיד לכל האתר). */}
          {!salesOpen ? (
            <BookLink
              href="/preview"
              morphCover
              className="group inline-flex items-center gap-2 self-start text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              קראו טעימה מהספר · 2 דקות
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                aria-hidden="true"
              />
            </BookLink>
          ) : null}

          <p className="text-[13px] leading-relaxed text-foreground-muted">
            האתר בשלב טרום-השקה. עם פתיחת המכירה תתאפשר רכישה מאובטחת של
            המהדורה הדיגיטלית. למדיניות המוצר ראו{" "}
            <Link
              href="/shipping-returns"
              className="text-brand-hover underline underline-offset-2 hover:text-foreground"
            >
              מדיניות מוצר, משלוחים וביטולים
            </Link>
            .
          </p>
        </div>

        {/* עטיפה */}
        <div className="order-1 flex items-center justify-center border-b border-border-strong bg-surface-muted p-8 sm:order-2 sm:border-b-0 sm:border-s">
          <Image
            src={siteConfig.images.cover}
            alt={siteConfig.images.coverAlt}
            width={300}
            height={450}
            unoptimized
            className="h-auto w-36 rounded-sm shadow-[0_18px_36px_-22px_rgba(43,36,31,0.6)] sm:w-full sm:max-w-[180px]"
          />
        </div>
      </div>
    </div>
  );
}
