"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, MessageCircle, BookOpen, BarChart3 } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "בית", icon: Home },
  { href: "/tools", label: "כלים", icon: Wrench },
  { href: "/coach", label: "המאמן", icon: MessageCircle },
  { href: "/learn", label: "למידה", icon: BookOpen },
  { href: "/progress", label: "התקדמות", icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-sand-200 bg-sand-50/95 backdrop-blur supports-[backdrop-filter]:bg-sand-50/80"
      aria-label="ניווט ראשי"
    >
      <ul className="mx-auto max-w-2xl flex justify-between px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors",
                  isActive
                    ? "text-ink-700"
                    : "text-ink-300 hover:text-ink-500",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn("size-5", isActive && "stroke-[2.4]")}
                />
                <span className="text-[11px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
