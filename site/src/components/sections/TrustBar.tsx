import { ShieldCheck, Download, Smartphone, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { siteConfig } from "@/config/site";

const ICONS: Record<string, LucideIcon> = {
  "secure-payment": ShieldCheck,
  download: Download,
  devices: Smartphone,
  guest: Sparkles,
};

export function TrustBar({ className }: { className?: string }) {
  const items = siteConfig.trustBar.filter((item) => {
    if (!item.enabled) return false;
    // אין להציג "תשלום מאובטח" כל עוד ספק התשלום הוא הדגמה (Mock).
    if ("demoHidden" in item && item.demoHidden && siteConfig.isPaymentDemoMode) {
      return false;
    }
    return true;
  });
  if (items.length === 0) return null;

  return (
    <ul
      className={
        "flex flex-wrap items-center gap-x-6 gap-y-3 text-[16.5px] leading-relaxed text-foreground/75" +
        (className ? ` ${className}` : "")
      }
    >
      {items.map((item, index) => {
        const Icon = ICONS[item.id] ?? ShieldCheck;
        return (
          <li key={item.id} className="flex items-center gap-2.5">
            {index > 0 ? (
              <span
                className="hidden h-1 w-1 rounded-full bg-border-strong sm:inline-block"
                aria-hidden="true"
              />
            ) : null}
            <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
            {item.label}
          </li>
        );
      })}
    </ul>
  );
}
