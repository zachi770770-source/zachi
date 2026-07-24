"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Download, Smartphone, Package, BadgeInfo } from "lucide-react";

import { siteConfig } from "@/config/site";
import { calculateOrderTotals, formatPrice } from "@/lib/pricing";
import type { ProductFormat } from "@/lib/pricing";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { FormatSelector } from "@/components/purchase/FormatSelector";

export function PurchaseCard() {
  const router = useRouter();
  const [format, setFormat] = React.useState<ProductFormat>(
    siteConfig.products.defaultFormat
  );
  // המהדורה הדיגיטלית אינה "כמות" — קובץ יחיד. הכמות תמיד 1.
  const totals = calculateOrderTotals(1, format);
  const demo = siteConfig.isPaymentDemoMode;
  const isDigital = format === "digital";

  function handleBuy() {
    trackEvent("add_to_cart", { format });
    router.push(`/checkout?format=${format}`);
  }

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
              זמין כמהדורה דיגיטלית — מהדורה מודפסת בקרוב
            </p>
          </div>

          <FormatSelector value={format} onChange={setFormat} />

          <div className="flex items-baseline gap-2 border-t border-foreground/12 pt-5">
            <span className="type-quote text-[40px] font-bold text-brand-hover">
              {formatPrice(totals.unitPrice)}
            </span>
            {isDigital ? (
              <span className="text-[15px] text-foreground-muted">
                מחיר סופי · ללא משלוח
              </span>
            ) : null}
          </div>

          {isDigital ? (
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
              {demo ? (
                <li className="flex items-center gap-2.5">
                  <BadgeInfo className="h-[18px] w-[18px] text-brand" aria-hidden="true" />
                  מצב הדגמה · התשלום אינו פעיל עדיין
                </li>
              ) : null}
            </ul>
          ) : null}

          <Button size="lg" onClick={handleBuy} className="h-14 w-full text-[17px]">
            לרכישת הספר הדיגיטלי — {formatPrice(totals.total)}
          </Button>

          <p className="text-[13px] leading-relaxed text-foreground-muted">
            {demo ? "מצב הדגמה: לא יתבצע חיוב בפועל. " : null}
            לאחר התשלום נשלח אליכם את הגישה למהדורה הדיגיטלית במייל. למדיניות
            המוצר, ביטולים והחזרים ראו{" "}
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
