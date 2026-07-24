import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/pricing";
import type { OrderTotals } from "@/lib/pricing";

export function OrderSummary({ totals }: { totals: OrderTotals }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted p-5">
      <h2 className="font-serif text-lg font-semibold">סיכום הזמנה</h2>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-foreground-muted">
          {siteConfig.bookTitle} × {totals.quantity}
        </span>
        <span>{formatPrice(totals.subtotal)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-foreground-muted">משלוח</span>
        <span>{totals.shipping === 0 ? "חינם" : formatPrice(totals.shipping)}</span>
      </div>

      {totals.discount > 0 ? (
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-foreground-muted">הנחה</span>
          <span>-{formatPrice(totals.discount)}</span>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="font-semibold">סה&quot;כ לתשלום</span>
        <span className="font-serif text-xl font-semibold text-brand-hover">
          {formatPrice(totals.total)}
        </span>
      </div>

      {siteConfig.bonus.enabled && siteConfig.bonus.includedInPrice ? (
        <p className="mt-3 text-xs text-foreground-muted">
          כולל את חוברת העבודה הדיגיטלית, {siteConfig.bonus.deliveryTiming}.
        </p>
      ) : null}
    </div>
  );
}
