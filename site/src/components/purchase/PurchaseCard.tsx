"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Truck, Package, BadgeInfo } from "lucide-react";

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
  const demo = siteConfig.isPaymentDemoMode;

  function handleBuy() {
    trackEvent("add_to_cart", { quantity });
    router.push(`/checkout?quantity=${quantity}`);
  }

  return (
    <div
      id="purchase"
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_40px_80px_-50px_rgba(34,38,43,0.4)]"
    >
      <div className="grid sm:grid-cols-[minmax(0,1fr)_15rem]">
        {/* פרטים + רכישה */}
        <div className="order-2 flex flex-col gap-5 p-8 sm:order-1 sm:p-10">
          <div>
            <h3 className="text-2xl font-bold">{siteConfig.bookTitle}</h3>
            <p className="mt-1 text-[15px] text-foreground-muted">
              ספר מודפס, כריכה רכה
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="type-quote text-4xl font-semibold text-brand-hover">
              {formatPrice(siteConfig.commerce.price)}
            </span>
            {siteConfig.commerce.showCompareAtPrice &&
            siteConfig.commerce.compareAtPrice ? (
              <span className="text-base text-foreground-muted line-through">
                {formatPrice(siteConfig.commerce.compareAtPrice)}
              </span>
            ) : null}
            <span className="text-[15px] text-foreground-muted">לעותק</span>
          </div>

          <ul className="flex flex-col gap-2.5 text-[15px] text-foreground-muted">
            <li className="flex items-center gap-2.5">
              <Package className="h-[18px] w-[18px] text-brand" aria-hidden="true" />
              {siteConfig.bonus.enabled && siteConfig.bonus.includedInPrice
                ? "כולל חוברת עבודה דיגיטלית"
                : "הספר המודפס בלבד"}
            </li>
            <li className="flex items-center gap-2.5">
              <Truck className="h-[18px] w-[18px] text-brand" aria-hidden="true" />
              משלוח {formatPrice(siteConfig.commerce.shippingFlatRate)} · אספקה
              משוערת {siteConfig.commerce.estimatedDeliveryText}
            </li>
            {demo ? (
              <li className="flex items-center gap-2.5">
                <BadgeInfo
                  className="h-[18px] w-[18px] text-brand"
                  aria-hidden="true"
                />
                מצב הדגמה · התשלום אינו פעיל עדיין
              </li>
            ) : null}
          </ul>

          <Separator />

          <QuantitySelector value={quantity} onChange={setQuantity} />

          <div className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3 text-[15px]">
            <span className="text-foreground-muted">סה&quot;כ לתשלום</span>
            <span className="text-xl font-bold">{formatPrice(totals.total)}</span>
          </div>

          <Button size="lg" onClick={handleBuy} className="w-full">
            לרכישה · {formatPrice(totals.total)}
          </Button>

          <p className="text-[13px] leading-relaxed text-foreground-muted">
            {demo
              ? "מצב הדגמה: לא תתבצע חיוב בפועל. "
              : null}
            לפרטי משלוח, ביטולים והחזרות ראו{" "}
            <Link
              href="/shipping-returns"
              className="text-brand-hover underline underline-offset-2 hover:text-foreground"
            >
              מדיניות משלוחים והחזרות
            </Link>
            .
          </p>
        </div>

        {/* עטיפה */}
        <div className="order-1 flex items-center justify-center bg-surface-muted p-8 sm:order-2">
          <Image
            src={siteConfig.images.cover}
            alt={siteConfig.images.coverAlt}
            width={300}
            height={450}
            unoptimized
            className="h-auto w-40 rounded-md shadow-[0_20px_40px_-24px_rgba(34,38,43,0.55)] sm:w-full sm:max-w-[190px]"
          />
        </div>
      </div>
    </div>
  );
}
