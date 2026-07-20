"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { calculateOrderTotals } from "@/lib/pricing";
import { siteConfig } from "@/config/site";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { QuantitySelector } from "@/components/purchase/QuantitySelector";

export function CheckoutClient() {
  const searchParams = useSearchParams();
  const initialQuantity = Number(searchParams.get("quantity")) || 1;
  const [quantity, setQuantity] = React.useState(
    Math.min(Math.max(initialQuantity, 1), 20)
  );

  const totals = calculateOrderTotals(quantity);

  if (siteConfig.commerce.availability === "out_of_stock") {
    return (
      <div className="rounded-lg border border-border bg-surface-muted p-8 text-center">
        <p className="text-lg text-foreground-muted">
          המוצר אינו זמין לרכישה כרגע.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="order-2 flex flex-col gap-6 lg:order-1">
        <div className="rounded-lg border border-border bg-surface p-5">
          <QuantitySelector value={quantity} onChange={setQuantity} />
        </div>
        <CheckoutForm quantity={quantity} />
      </div>

      <div className="order-1 lg:order-2">
        <div className="lg:sticky lg:top-24">
          <OrderSummary totals={totals} />
        </div>
      </div>
    </div>
  );
}
