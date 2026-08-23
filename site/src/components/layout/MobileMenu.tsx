"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X, Compass } from "lucide-react";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { navLinks } from "@/config/nav";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/BrandMark";

function isActivePath(pathname: string, href: string): boolean {
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileMenu() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
          aria-label="פתיחת תפריט ניווט"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-[2px] data-[state=open]:animate-fade-in lg:hidden" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 start-0 z-50 flex w-[min(85vw,22rem)] flex-col gap-6 overscroll-contain bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-drawer-in lg:hidden"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
              <BrandMark withRing className="h-8 w-8 shrink-0 text-foreground" />
              {siteConfig.bookTitle}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="flex h-10 w-10 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label="סגירת תפריט"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <nav aria-label="ניווט ראשי" className="-mx-1 flex flex-col">
            {navLinks.map((link) => {
              const active = isActivePath(pathname, link.href);
              const isCompass = link.href === "/compass";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md border-s-2 px-3 py-3 text-[17px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                    active
                      ? "border-brand bg-surface-muted font-semibold text-foreground"
                      : "border-transparent font-medium text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                  )}
                >
                  {isCompass ? (
                    <Compass
                      className={cn("h-[18px] w-[18px]", active ? "text-brand" : "text-brand-hover/80")}
                      aria-hidden="true"
                    />
                  ) : null}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            {/* מחליף-שפה מעל ה-CTA ובסגנון שקט — גלוי במובייל, אך לא מתחרה
                בכפתור הרכישה שמתחתיו. */}
            <LanguageSwitch to="en" onNavigate={() => setOpen(false)} />

            <Button asChild size="lg" className="w-full">
              <Link href="/book#purchase" onClick={() => setOpen(false)}>
                לרכישת הספר
              </Link>
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
