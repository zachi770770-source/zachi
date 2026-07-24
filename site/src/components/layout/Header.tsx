import Link from "next/link";

import { siteConfig } from "@/config/site";
import { navLinks } from "@/config/nav";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { BrandMark } from "@/components/shared/BrandMark";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-strong/70 bg-background/95 shadow-[0_1px_0_rgba(34,38,43,0.04),0_8px_24px_-20px_rgba(34,38,43,0.35)] backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[76px] lg:grid lg:grid-cols-[1fr_auto_1fr]">
        {/* לוגו + סמל מותג (מימין ב-RTL) */}
        <div className="flex items-center lg:justify-start">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            aria-label={`${siteConfig.bookTitle} — לעמוד הבית`}
          >
            <BrandMark withRing className="h-8 w-8 shrink-0 text-foreground" />
            <span className="font-sans text-lg font-extrabold tracking-tight sm:text-xl">
              {siteConfig.bookTitle}
            </span>
          </Link>
        </div>

        {/* ניווט (במרכז) */}
        <nav
          aria-label="ניווט ראשי"
          className="hidden items-center gap-8 lg:flex lg:justify-center"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA (משמאל ב-RTL) */}
        <div className="hidden lg:flex lg:justify-end">
          <Button asChild size="sm" className="h-11 px-5 text-[15px]">
            <Link href="/#purchase">לרכישת הספר</Link>
          </Button>
        </div>

        {/* מובייל: כפתור רכישה קומפקטי + המבורגר */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button asChild size="sm" className="h-10 px-4 text-sm">
            <Link href="/#purchase">רכישה</Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
