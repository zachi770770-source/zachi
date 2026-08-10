"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Smartphone, BookOpen, ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import type { ProductFormat } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { BookLink } from "@/components/shared/BookLink";
import { FormatSelector } from "@/components/purchase/FormatSelector";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";

/**
 * אזור הרכישה של עמוד הספר. הספר זמין *עכשיו* במהדורת Kindle באמזון —
 * הפעולה הראשית היא רכישה חיצונית באמזון, והמשנית היא טעימה. אין checkout
 * מקומי ואין תשלום באתר. הזרימה הישנה של סליקה מקומית (`salesOpen=true`)
 * נשמרת דורמנטית למהדורה הישירה/מודפסת העתידית באתר.
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
              מאת צחי חן · {salesOpen ? "המהדורה הדיגיטלית" : siteConfig.amazon.availableLabel}
            </p>
          </div>

          {/* בורר מהדורות רלוונטי רק לזרימת הרכישה הישירה באתר (עתידית). */}
          {salesOpen ? <FormatSelector value={format} onChange={setFormat} /> : null}

          {salesOpen ? (
            <div className="border-t border-foreground/12 pt-5">
              <p className="type-quote text-[26px] font-bold text-brand-hover">
                {siteConfig.commerce.price} ₪
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5 border-t border-foreground/12 pt-5 text-[15px] text-foreground-muted">
              <li className="flex items-center gap-2.5">
                <BookOpen className="h-[18px] w-[18px] text-brand" aria-hidden="true" />
                {siteConfig.amazon.editionLabel} — קריאה מיידית אחרי הרכישה
              </li>
              <li className="flex items-center gap-2.5">
                <Smartphone className="h-[18px] w-[18px] text-brand" aria-hidden="true" />
                קריאה באפליקציית Kindle או בכל מכשיר תואם
              </li>
            </ul>
          )}

          {salesOpen ? (
            <Button asChild size="lg" className="h-14 w-full text-[17px]">
              <Link href="/checkout">לרכישת הספר</Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="h-14 w-full text-[17px]">
              <AmazonBuyLink source="book">{siteConfig.amazon.buyLabel}</AmazonBuyLink>
            </Button>
          )}

          {/* פעולה משנית שקטה: טעימה מהספר (אותו מונח אחיד לכל האתר). */}
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

          <p className="text-[13px] leading-relaxed text-foreground-muted">
            הרכישה מתבצעת בפלטפורמת Amazon וכפופה לתנאי הרכישה, התשלום והאספקה
            שלה. אם בעתיד תיפתח רכישה ישירה באתר —{" "}
            <Link
              href="/shipping-returns"
              className="text-brand-hover underline underline-offset-2 hover:text-foreground"
            >
              מדיניות המוצר של האתר
            </Link>{" "}
            תחול עליה בעת פתיחתה.
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
