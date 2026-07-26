"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { FileText, Download, Smartphone, Package } from "lucide-react";

import { siteConfig } from "@/config/site";
import type { ProductFormat } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { FormatSelector } from "@/components/purchase/FormatSelector";

/**
 * מצב Pre-launch: האתר ציבורי אך המכירה סגורה. אין מעבר ל-checkout ואין
 * תשלום. המחיר מוצג כ"בקרוב" וה-CTA אינו מטעה. כאשר salesOpen יופעל, יש
 * להחזיר את זרימת הרכישה הפעילה.
 */
export function PurchaseCard() {
  const [format, setFormat] = React.useState<ProductFormat>(
    siteConfig.products.defaultFormat
  );

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
              מאת צחי חן · המכירה תיפתח בקרוב
            </p>
          </div>

          <FormatSelector value={format} onChange={setFormat} />

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
            <Link href="/preview">לקריאת טעימה מהספר</Link>
          </Button>

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
            width={1400}
            height={2100}
            unoptimized
            className="h-auto w-36 rounded-sm shadow-[0_18px_36px_-22px_rgba(43,36,31,0.6)] sm:w-full sm:max-w-[180px]"
          />
        </div>
      </div>
    </div>
  );
}
