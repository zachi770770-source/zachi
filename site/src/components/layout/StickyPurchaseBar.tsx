"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";
import { trackEvent } from "@/lib/analytics";

const VISIBLE_ROUTES = new Set(["/", "/preview", "/author", "/faq", "/contact"]);

export function StickyPurchaseBar() {
  const pathname = usePathname();
  const eligibleRoute = VISIBLE_ROUTES.has(pathname ?? "");

  if (!siteConfig.features.stickyPurchaseBar || !eligibleRoute) return null;

  // ה-key ממחזר (remount) את הרכיב בכל שינוי נתיב, כך ש"הוסתר על ידי
  // המשתמש" ו"עבר את ה-Hero" מתאפסים באופן טבעי בלי useEffect שמעדכן
  // state בהתאם לפרופ שהשתנה.
  return <StickyPurchaseBarContent key={pathname} />;
}

function StickyPurchaseBarContent() {
  const [pastHero, setPastHero] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    let ticking = false;
    const threshold = Math.max(window.innerHeight * 0.7, 420);

    function handleScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setPastHero(window.scrollY > threshold);
        ticking = false;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!pastHero || dismissed) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur animate-slide-up lg:hidden"
      role="region"
      aria-label="רכישה מהירה"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-foreground-muted">
            {siteConfig.bookTitle}
          </span>
          <span className="font-serif text-lg font-semibold">
            {formatPrice(siteConfig.commerce.price)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild onClick={() => trackEvent("click_buy_sticky")}>
            <Link href="/checkout">לרכישה</Link>
          </Button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="סגירת פס הרכישה"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
