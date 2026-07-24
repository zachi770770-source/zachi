import Link from "next/link";

import { siteConfig } from "@/config/site";
import { footerLinks } from "@/config/nav";
import { Container } from "@/components/shared/Container";
import { InstagramIcon, FacebookIcon } from "@/components/shared/SocialIcons";

export function Footer() {
  const hasSocial =
    siteConfig.social.instagram || siteConfig.social.facebook;

  return (
    <footer className="border-t border-border bg-surface-muted">
      <Container className="flex flex-col gap-10 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex max-w-sm flex-col gap-2">
            <span className="font-serif text-lg font-semibold">
              {siteConfig.bookTitle}
            </span>
            <p className="text-sm text-foreground-muted">
              {siteConfig.tagline}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:flex sm:gap-16">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-foreground">
                מידע
              </span>
              <ul className="flex flex-col gap-2">
                {footerLinks.main.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-foreground">
                מדיניות
              </span>
              <ul className="flex flex-col gap-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {hasSocial ? (
          <div className="flex gap-4">
            {siteConfig.social.instagram ? (
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="אינסטגרם"
                className="text-foreground-muted transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
            ) : null}
            {siteConfig.social.facebook ? (
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="פייסבוק"
                className="text-foreground-muted transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {siteConfig.copyrightYear} {siteConfig.bookTitle}. כל הזכויות
            שמורות.
          </p>
          <p>האתר בבנייה מתמדת לשיפור הנגישות עבור כלל המשתמשים.</p>
        </div>
      </Container>
    </footer>
  );
}
