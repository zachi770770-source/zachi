import { ShieldCheck, Truck, BookOpenCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { siteConfig } from "@/config/site";

const ICONS: Record<string, LucideIcon> = {
  "secure-payment": ShieldCheck,
  shipping: Truck,
  workbook: BookOpenCheck,
};

export function TrustBar() {
  const items = siteConfig.trustBar.filter((item) => item.enabled);
  if (items.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground-muted">
      {items.map((item) => {
        const Icon = ICONS[item.id] ?? ShieldCheck;
        return (
          <li key={item.id} className="flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
            {item.label}
          </li>
        );
      })}
    </ul>
  );
}
