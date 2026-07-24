"use client";

import * as React from "react";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";

import { siteConfig } from "@/config/site";
import { navLinks } from "@/config/nav";
import { Button } from "@/components/ui/button";

export function MobileMenu() {
  const [open, setOpen] = React.useState(false);

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
          className="fixed inset-y-0 start-0 z-50 flex w-[min(85vw,22rem)] flex-col gap-6 bg-surface p-6 shadow-lg focus:outline-none lg:hidden"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="font-serif text-lg font-semibold">
              {siteConfig.bookTitle}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="flex h-10 w-10 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label="סגירת תפריט"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <nav aria-label="ניווט ראשי" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto">
            <Button asChild size="lg" className="w-full">
              <Link href="/#purchase" onClick={() => setOpen(false)}>
                {siteConfig.salesOpen ? "לרכישת הספר" : "בקרוב"}
              </Link>
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
