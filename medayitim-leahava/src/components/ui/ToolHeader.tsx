import Link from "next/link";
import type { ReactNode } from "react";

interface ToolHeaderProps {
  title: string;
  intro: string;
  children?: ReactNode;
}

export function ToolHeader({ title, intro, children }: ToolHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <Link
        href="/tools"
        className="text-sm text-clay-500 hover:text-clay-600"
      >
        → חזרה לספריית הכלים
      </Link>
      <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
      <p className="max-w-2xl text-ink-700">{intro}</p>
      {children}
    </header>
  );
}
