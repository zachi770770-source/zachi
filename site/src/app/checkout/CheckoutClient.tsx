"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { calculateOrderTotals } from "@/lib/pricing";
import type { ProductFormat } from "@/lib/pricing";
import { siteConfig } from "@/config/site";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { QuantitySelector } from "@/components/purchase/QuantitySelector";

export function CheckoutClient({
  initialQuantity,
  initialFormat,
  paymentFailed = false,
}: {
  initialQuantity: number;
  initialFormat: ProductFormat;
  paymentFailed?: boolean;
}) {
  const [quantity, setQuantity] = React.useState(
    Math.min(Math.max(initialQuantity, 1), 20)
  );

  const totals = calculateOrderTotals(quantity, initialFormat);

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
        {paymentFailed ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-foreground px-4 py-3 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            התשלום לא הושלם. בדקו את פרטי התשלום ונסו שוב - הפרטים שמילאתם לא
            נשמרו ויש להזין אותם מחדש.
          </div>
        ) : null}
        {siteConfig.products.formats[initialFormat].requiresShipping ? (
          <div className="rounded-lg border border-border bg-surface p-5">
            <QuantitySelector value={quantity} onChange={setQuantity} />
          </div>
        ) : null}
        <CheckoutForm quantity={quantity} format={initialFormat} />
      </div>

      <div className="order-1 lg:order-2">
        <div className="lg:sticky lg:top-24">
          <OrderSummary totals={totals} />
        </div>
      </div>
    </div>
  );
}
