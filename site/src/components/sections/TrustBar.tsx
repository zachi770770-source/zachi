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
    <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 text-base font-medium text-foreground">
      {items.map((item) => {
        const Icon = ICONS[item.id] ?? ShieldCheck;
        return (
          <li key={item.id} className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
            {item.label}
          </li>
        );
      })}
    </ul>
  );
}
