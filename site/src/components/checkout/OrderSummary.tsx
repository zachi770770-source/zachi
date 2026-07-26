import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/pricing";
import type { OrderTotals } from "@/lib/pricing";

export function OrderSummary({ totals }: { totals: OrderTotals }) {
  const definition = siteConfig.products.formats[totals.format];
  const requiresShipping = definition.requiresShipping;

  return (
    <div className="rounded-lg border border-border bg-surface-muted p-5">
      <h2 className="font-serif text-lg font-semibold">סיכום הזמנה</h2>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-foreground-muted">
          {siteConfig.bookTitle} · {definition.label} × {totals.quantity}
        </span>
        <span>{formatPrice(totals.subtotal)}</span>
      </div>

      {totals.discount > 0 ? (
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-foreground-muted">הנחה</span>
          <span>-{formatPrice(totals.discount)}</span>
        </div>
      ) : null}

      {requiresShipping ? (
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-foreground-muted">משלוח</span>
          <span>
            {totals.shipping > 0
              ? formatPrice(totals.shipping)
              : "מחושב בהמשך"}
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="font-semibold">סה&quot;כ לתשלום</span>
        <span className="font-serif text-xl font-semibold text-brand-hover">
          {formatPrice(totals.total)}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-foreground-muted">
        {requiresShipping
          ? "מהדורה מודפסת: תישלח לכתובת שתזינו."
          : "מהדורה דיגיטלית: הגישה תישלח לכתובת המייל שהזנתם. ללא משלוח."}
        {siteConfig.bonus.enabled && siteConfig.bonus.includedInPrice
          ? " כולל את חוברת העבודה הדיגיטלית."
          : null}
      </p>
    </div>
  );
}
