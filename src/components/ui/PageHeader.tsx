"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  showBack?: boolean;
  className?: string;
}

export function PageHeader({ title, eyebrow, description, showBack = true, className }: PageHeaderProps) {
  const router = useRouter();
  return (
    <header className={cn("pt-6 pb-4 px-5", className)}>
      {showBack && (
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1 text-sm text-ink-400 hover:text-ink-600 transition-colors"
        >
          <ArrowRight className="size-4" />
          חזרה
        </button>
      )}
      {eyebrow && (
        <p className="text-xs uppercase tracking-wider text-clay-400 font-medium mb-2">
          {eyebrow}
        </p>
      )}
      {title && (
        <h1 className="font-serif text-3xl text-ink-700 leading-tight">
          {title}
        </h1>
      )}
      {description && (
        <p className="mt-3 text-ink-500 leading-relaxed">{description}</p>
      )}
    </header>
  );
}
