import Link from "next/link";

import { siteConfig } from "@/config/site";
import { footerLinks } from "@/config/nav";
import { Container } from "@/components/shared/Container";
import { BrandMark } from "@/components/shared/BrandMark";
import { SignatureMark } from "@/components/shared/SignatureMark";
import { InstagramIcon, FacebookIcon } from "@/components/shared/SocialIcons";

/**
 * פוטר עריכתי: בלוק מותג עם הסמל בצד המתחיל, שני טורי קישורים בצד המסים,
 * וקו שיער שמפריד את שורת הזכויות/הנגישות. משטח-עומק מרווה (secondary),
 * טיפוגרפיה מדורגת וקצב אנכי נדיב — לא רשת קישורים גנרית.
 */
export function Footer() {
  const hasSocial = siteConfig.social.instagram || siteConfig.social.facebook;

  const linkClass =
    "inline-block py-1 text-[15px] text-secondary-foreground/80 transition-colors hover:text-secondary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-muted";

  return (
    <footer className="border-t border-secondary-foreground/15 bg-secondary text-secondary-foreground">
      <Container className="flex flex-col gap-5 py-7 sm:gap-12 sm:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-10">
          {/* בלוק המותג — רוחב מלא במובייל; שני טורי הקישורים יושבים זה לצד זה מתחתיו */}
          <div className="col-span-2 flex max-w-sm flex-col gap-2.5 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <BrandMark
                withRing
                className="h-9 w-9 shrink-0 text-secondary-foreground"
              />
              <span className="font-sans text-xl font-extrabold tracking-tight">
                {siteConfig.bookTitle}
              </span>
            </div>
            <p className="hidden font-quote text-[1.05rem] italic leading-relaxed text-secondary-foreground/85 sm:block">
              {siteConfig.tagline}
            </p>
            {/* הסימן החתום „מחיפוש לבנייה” — סוגר שקט מתחת למשפט-המותג. */}
            <SignatureMark tone="inverse" className="mt-1 hidden sm:inline-flex" />
            {hasSocial ? (
              <div className="mt-1 flex gap-3">
                {siteConfig.social.instagram ? (
                  <a
                    href={siteConfig.social.instagram}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="אינסטגרם"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-secondary-foreground/80 transition-colors hover:bg-secondary-foreground/10 hover:text-secondary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-muted"
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
                    className="flex h-11 w-11 items-center justify-center rounded-full text-secondary-foreground/80 transition-colors hover:bg-secondary-foreground/10 hover:text-secondary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-muted"
                  >
                    <FacebookIcon className="h-5 w-5" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <FooterColumn title="מידע" links={footerLinks.main} linkClass={linkClass} />
          <FooterColumn title="מדיניות" links={footerLinks.legal} linkClass={linkClass} />
        </div>

        <div className="flex flex-col gap-2 border-t border-secondary-foreground/15 pt-5 text-[13px] text-secondary-foreground/85 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <p>
            © {siteConfig.copyrightYear} {siteConfig.bookTitle}. כל הזכויות שמורות.
          </p>
          <p>
            אנו פועלים לשיפור הנגישות באופן מתמשך.{" "}
            <Link
              href="/accessibility"
              className="underline underline-offset-2 hover:text-secondary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-muted"
            >
              הצהרת נגישות
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  linkClass,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
  linkClass: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-secondary-foreground/90">
        {title}
      </span>
      <ul className="flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
