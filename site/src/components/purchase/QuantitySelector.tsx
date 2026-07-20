"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (quantity: number) => void;
}) {
  const offers = siteConfig.commerce.quantityOffers.filter((o) => o.enabled);

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-foreground">
        כמות
      </legend>
      <div
        role="radiogroup"
        aria-label="בחירת כמות עותקים"
        className="grid gap-2 sm:grid-cols-3"
      >
        {offers.map((offer) => {
          const selected = value === offer.quantity;
          return (
            <button
              key={offer.quantity}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(offer.quantity)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md border px-3 py-2.5 text-center text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                selected
                  ? "border-brand bg-brand-muted text-brand"
                  : "border-border-strong text-foreground-muted hover:border-brand/50"
              )}
            >
              <span className="font-semibold">{offer.label}</span>
              {offer.note ? (
                <span className="text-xs text-foreground-muted">
                  {offer.note}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
