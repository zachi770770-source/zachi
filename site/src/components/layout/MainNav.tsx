"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";

import { cn } from "@/lib/utils";
import { navLinks } from "@/config/nav";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";

/**
 * ניווט הדסקטופ — קבוצה אחת מלוכדת: קישורים עם מצב active ברור (קו טרקוטה
 * דק מתחת), ואחריהם מפריד שיער וה-CTA, כך שהקריאה לפעולה נקראת כחלק
 * מהסרגל ולא ככפתור מנותק. „המצפן” מסומן בסמל ייעודי כדי להבליט את הבידול
 * המרכזי של האתר. מצב active נגזר מהנתיב (קישורי עוגן בעמוד הבית אינם
 * מקבלים active קבוע, כי הם תלויי-גלילה).
 */
function isActivePath(pathname: string, href: string): boolean {
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainNav() {
  const pathname = usePathname();
  const ctaHref = "/book#purchase";
  const ctaLabel = "לרכישת הספר";

  return (
    <div className="hidden items-center gap-1 lg:flex">
      <nav aria-label="ניווט ראשי" className="flex items-center">
        {navLinks.map((link) => {
          const active = isActivePath(pathname, link.href);
          const isCompass = link.href === "/compass";
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[15px] font-medium tracking-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                active ? "text-foreground" : "text-foreground-muted hover:text-foreground"
              )}
            >
              {isCompass ? (
                <Compass
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active ? "text-brand" : "text-brand-hover/80 group-hover:text-brand"
                  )}
                  aria-hidden="true"
                />
              ) : null}
              {link.label}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand transition-transform duration-200 ease-out",
                  active
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100"
                )}
              />
            </Link>
          );
        })}
      </nav>

      <span aria-hidden="true" className="mx-3 h-5 w-px bg-border-strong" />

      {/* מחליף-שפה לפני ה-CTA ובסגנון שקט, כדי שלא יתחרה בכפתור הרכישה. */}
      <LanguageSwitch to="en" className="me-3" />

      <Button asChild size="sm" className="h-10 px-5 text-[15px]">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
