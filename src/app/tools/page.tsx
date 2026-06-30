"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TOOLS, TOOL_CATEGORIES } from "@/content/tools";
import type { ToolCategory } from "@/types";

export default function ToolsIndexPage() {
  const grouped: Record<string, typeof TOOLS> = {};
  for (const t of TOOLS) {
    (grouped[t.category] = grouped[t.category] ?? []).push(t);
  }

  const order: ToolCategory[] = ["diagnosis", "decision", "communication", "emergency", "growth"];

  return (
    <main className="animate-fade-in">
      <PageHeader
        eyebrow="הכלים"
        title="חמישה־עשר כלים מהספר"
        description="לכל כלי טופס קצר ושיקוף בשפת הספר. אין כלים גנריים — רק מה שהספר עצמו מציע."
        showBack={false}
      />

      <div className="px-5 space-y-8 pb-8">
        {order.map((cat) => {
          const tools = grouped[cat] ?? [];
          if (tools.length === 0) return null;
          const meta = TOOL_CATEGORIES[cat];
          return (
            <section key={cat}>
              <header className="mb-3">
                <h2 className="font-medium text-ink-700">{meta.label}</h2>
                <p className="text-xs text-ink-400">{meta.description}</p>
              </header>
              <div className="space-y-2.5">
                {tools.map((t) => (
                  <Link key={t.slug} href={`/tools/${t.slug}`}>
                    <Card className="hover:bg-sand-100 transition-colors group cursor-pointer">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-ink-700">{t.title}</p>
                            {t.tier === "premium" && (
                              <Badge tone="premium">Premium</Badge>
                            )}
                          </div>
                          <p className="text-sm text-ink-500 leading-snug">{t.tagline}</p>
                          <p className="text-[11px] text-ink-300 mt-2">{t.chapterSource}</p>
                        </div>
                        <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500 shrink-0" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
