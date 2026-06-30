import Link from "next/link";

const navItems = [
  { href: "/", label: "ראשי" },
  { href: "/quiz", label: "אבחון" },
  { href: "/tools", label: "כלים" },
  { href: "/method", label: "השיטה" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-cream-100/85 border-b border-cream-300/60">
      <div className="container-wide flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-lg sm:text-xl font-semibold text-burgundy-700 tracking-tight">
          מדייטים לאהבה
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 sm:px-4 py-2 text-sm sm:text-[15px] text-ink-700 hover:text-burgundy-700 hover:bg-cream-200/70 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
