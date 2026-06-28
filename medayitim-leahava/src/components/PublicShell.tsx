import Link from "next/link";
import type { ReactNode } from "react";

/** Footer links shown across public/legal pages and the landing footer. */
export const TRUST_LINKS = [
  { href: "/privacy", label: "מדיניות פרטיות" },
  { href: "/terms", label: "תנאי שימוש" },
  { href: "/help", label: "קבלת עזרה מקצועית ובטיחותית" },
];

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-sand-200 bg-sand-100/60">
      <div className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-clay-500">
        <p className="font-medium text-ink-700">מדייטים לאהבה</p>
        <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {TRUST_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-clay-600 hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed">
          הכלים כאן נועדו לעזור לחשוב בבהירות ולבחור בבגרות. הם אינם מהווים ייעוץ
          או טיפול פסיכולוגי ואינם תחליף לעזרה מקצועית. במצבים של אלימות, פחד,
          שליטה, השפלה או סכנה — יש לפנות לעזרה מקצועית.
        </p>
        <p className="mt-4 text-xs text-clay-400">
          © {new Date().getFullYear()} מדייטים לאהבה
        </p>
      </div>
    </footer>
  );
}

/** Minimal shell for public/legal content pages. */
export function PublicShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-sand-200 bg-sand-50/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-ink-900">
            מדייטים לאהבה
          </Link>
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm text-ink-700 hover:bg-sand-100"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
        <div className="mt-6 flex flex-col gap-6 leading-relaxed text-ink-800">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/** Shared section block for legal copy. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-ink-900">{heading}</h2>
      <div className="flex flex-col gap-2 text-ink-700">{children}</div>
    </section>
  );
}
