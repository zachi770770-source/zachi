"use client";

import { Check } from "lucide-react";

import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/pricing";
import type { ProductFormat } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** סדר התצוגה של המהדורות בבורר. */
const FORMAT_ORDER: ProductFormat[] = ["digital", "physical", "bundle"];

export function FormatSelector({
  value,
  onChange,
}: {
  value: ProductFormat;
  onChange: (format: ProductFormat) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-foreground">
        בחירת מהדורה
      </legend>
      <div
        role="radiogroup"
        aria-label="בחירת מהדורת הספר"
        className="flex flex-col gap-2.5"
      >
        {FORMAT_ORDER.map((id) => {
          const format = siteConfig.products.formats[id];
          // ניתן לבחור מהדורה רק אם היא זמינה ותומחרה בפועל.
          const selectable = format.available && format.price != null;
          const selected = value === id;

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!selectable}
              onClick={() => selectable && onChange(id)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                !selectable && "cursor-not-allowed border-border bg-surface-muted/60 opacity-70",
                selectable && selected && "border-secondary bg-secondary-muted",
                selectable && !selected && "border-border-strong hover:border-secondary/50"
              )}
            >
              <span className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : "border-border-strong"
                  )}
                  aria-hidden="true"
                >
                  {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {format.label}
                  </span>
                  <span className="text-[13px] text-foreground-muted">
                    {format.tagline}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold">
                {selectable && format.price != null ? (
                  <span className="text-brand-hover">{formatPrice(format.price)}</span>
                ) : (
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-foreground-muted">
                    בקרוב
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
