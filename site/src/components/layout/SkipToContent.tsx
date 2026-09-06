"use client";

import { usePathname } from "next/navigation";

import { isEnglishPath } from "@/lib/language";

export function SkipToContent() {
  const english = isEnglishPath(usePathname());
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-foreground focus:outline-2 focus:outline-offset-2 focus:outline-brand"
    >
      {english ? "Skip to main content" : "דילוג לתוכן הראשי"}
    </a>
  );
}
