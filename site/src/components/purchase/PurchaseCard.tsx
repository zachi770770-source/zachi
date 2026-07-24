"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Truck, Package } from "lucide-react";

import { siteConfig } from "@/config/site";
import { calculateOrderTotals, formatPrice } from "@/lib/pricing";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuantitySelector } from "@/components/purchase/QuantitySelector";

export function PurchaseCard() {
  const router = useRouter();
  const [quantity, setQuantity] = React.useState(1);
  const totals = calculateOrderTotals(quantity);

  function handleBuy() {
    trackEvent("add_to_cart", { quantity });
    router.push(`/checkout?quantity=${quantity}`);
  }

  return (
    <div
      id="purchase"
      className="scroll-mt-24 rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row">
        <Image
          src={siteConfig.images.cover}
          alt={siteConfig.images.coverAlt}
          width={300}
          height={450}
          unoptimized
          className="mx-auto h-auto w-32 shrink-0 rounded-md shadow-md sm:mx-0 sm:w-36"
        />

        <div className="flex flex-1 flex-col gap-4">
          <div>
            <h3 className="font-serif text-xl font-semibold">
              {siteConfig.bookTitle}
            </h3>
            <p className="text-sm text-foreground-muted">ספר מודפס, כריכה רכה</p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-brand">
              {formatPrice(siteConfig.commerce.price)}
            </span>
            {siteConfig.commerce.showCompareAtPrice &&
            siteConfig.commerce.compareAtPrice ? (
              <span className="text-base text-foreground-muted line-through">
                {formatPrice(siteConfig.commerce.compareAtPrice)}
              </span>
            ) : null}
            <span className="text-sm text-foreground-muted">לעותק</span>
          </div>

          <ul className="flex flex-col gap-1.5 text-sm text-foreground-muted">
            <li className="flex items-center gap-2">
              <Package className="h-4 w-4 text-brand" aria-hidden="true" />
              {siteConfig.bonus.enabled && siteConfig.bonus.includedInPrice
                ? "כולל חוברת עבודה דיגיטלית"
                : "הספר המודפס בלבד"}
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand" aria-hidden="true" />
              משלוח: {formatPrice(siteConfig.commerce.shippingFlatRate)} ·
              זמן אספקה משוער {siteConfig.commerce.estimatedDeliveryText}
            </li>
            <li className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-brand" aria-hidden="true" />
              תשלום מאובטח · מצב הדגמה בסביבת פיתוח
            </li>
          </ul>

          <Separator />

          <QuantitySelector value={quantity} onChange={setQuantity} />

          <div className="flex items-center justify-between rounded-md bg-surface-muted px-4 py-3 text-sm">
            <span className="text-foreground-muted">סה&quot;כ לתשלום</span>
            <span className="font-serif text-lg font-semibold">
              {formatPrice(totals.total)}
            </span>
          </div>

          <Button size="lg" onClick={handleBuy} className="w-full sm:w-auto">
            לרכישה - {formatPrice(totals.total)}
          </Button>

          <p className="text-xs text-foreground-muted">
            לפרטי משלוח, ביטולים והחזרות ראו{" "}
            <Link href="/shipping-returns" className="underline hover:text-foreground">
              מדיניות משלוחים והחזרות
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
