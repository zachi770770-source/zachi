"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/dashboard", label: "בית" },
  { href: "/situation", label: "מה קורה עכשיו?" },
  { href: "/tools", label: "כלים" },
  { href: "/journal", label: "יומן" },
  { href: "/settings", label: "הגדרות" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="sticky top-0 z-30 border-b border-sand-200 bg-sand-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-ink-900">
          מדייטים לאהבה
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                isActive(l.href)
                  ? "bg-sand-200 text-ink-900"
                  : "text-ink-700 hover:bg-sand-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="mr-2 rounded-full px-3 py-1.5 text-sm text-clay-600 hover:bg-sand-100 disabled:opacity-60"
          >
            {signingOut ? "מתנתק…" : "התנתקות"}
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-ink-800 md:hidden"
          aria-label="תפריט"
          aria-expanded={open}
        >
          <span className="block h-0.5 w-6 bg-ink-800" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink-800" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink-800" />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-sand-200 bg-sand-50 px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm ${
                isActive(l.href)
                  ? "bg-sand-200 text-ink-900"
                  : "text-ink-700 hover:bg-sand-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="block w-full rounded-lg px-3 py-2.5 text-right text-sm text-clay-600 hover:bg-sand-100"
          >
            {signingOut ? "מתנתק…" : "התנתקות"}
          </button>
        </div>
      )}
    </nav>
  );
}
