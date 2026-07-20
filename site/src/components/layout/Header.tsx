import Link from "next/link";

import { siteConfig } from "@/config/site";
import { navLinks } from "@/config/nav";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/MobileMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link
          href="/"
          className="flex flex-col leading-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <span className="font-serif text-lg font-semibold sm:text-xl">
            {siteConfig.bookTitle}
          </span>
          <span className="hidden text-xs text-foreground-muted sm:block">
            {siteConfig.tagline}
          </span>
        </Link>

        <nav
          aria-label="ניווט ראשי"
          className="hidden items-center gap-7 lg:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild>
            <Link href="/#purchase">לרכישת הספר</Link>
          </Button>
        </div>

        <MobileMenu />
      </div>
    </header>
  );
}
