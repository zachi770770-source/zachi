"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, RefreshCcw, Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Quote } from "@/components/ui/Quote";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ToolField } from "@/components/tools/ToolField";
import { findTool } from "@/content/tools";
import { useAppStore } from "@/store/useAppStore";
import { track } from "@/services/analytics/providerFactory";
import type { CatchEntry } from "@/types";

export default function ToolPage() {
  const params = useParams<{ slug: string }>();
  const tool = findTool(params.slug);
  const { addToolUsage, addCatch, addMaintenance, addGoal } = useAppStore();
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<{
    reflection: string;
    nextStep: string;
    nextToolSlug?: string;
  } | null>(null);

  if (!tool) {
    notFound();
  }

  const setValue = (id: string, v: string | number) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  };

  const canSubmit = tool.fields.every((f) => {
    const v = values[f.id];
    if (f.type === "slider") return Number(v) > 0;
    return v !== undefined && String(v).trim() !== "";
  });

  const handleSubmit = () => {
    if (!tool) return;
    const r = tool.resultBuilder(values);
    setResult(r);
    addToolUsage({
      toolSlug: tool.slug,
      values,
      reflection: r.reflection,
      timestamp: new Date().toISOString(),
    });
    track("tool_completed", { tool: tool.slug });

    // צד אפקטים ספציפיים לכלים בודדים
    if (tool.slug === "whos-driving" && values.voice && values.when) {
      const c: CatchEntry = {
        id: `c_${Date.now()}`,
        when: values.when as CatchEntry["when"],
        voice: values.voice as CatchEntry["voice"],
        note: String(values.situation ?? ""),
        timestamp: new Date().toISOString(),
      };
      addCatch(c);
      track("catch_logged", { when: c.when, voice: c.voice });
    }

    if (tool.slug === "twenty-min") {
      addMaintenance({
        id: `m_${Date.now()}`,
        whatWorked: String(values.worked ?? ""),
        overload: String(values.overload ?? ""),
        fixThisWeek: String(values.fix ?? ""),
        timestamp: new Date().toISOString(),
      });
      track("maintenance_session_completed");
      if (values.fix) {
        addGoal({
          id: `g_${Date.now()}`,
          text: String(values.fix),
          source: "tool",
          setAt: new Date().toISOString(),
        });
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRestart = () => {
    setValues({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (result) {
    const nextTool = result.nextToolSlug ? findTool(result.nextToolSlug) : null;
    return (
      <main className="animate-fade-in">
        <PageHeader eyebrow={tool.chapterSource} title={tool.title} />
        <div className="px-5 space-y-5">
          <Card tone="highlight">
            <p className="text-xs text-clay-500 mb-2 font-medium">השיקוף</p>
            <p className="text-ink-700 leading-relaxed whitespace-pre-line">
              {tool.resultIntro}
            </p>
          </Card>

          <Card>
            <p className="text-ink-600 leading-relaxed whitespace-pre-line">{result.reflection}</p>
          </Card>

          <Card tone="warm">
            <p className="text-xs text-clay-500 mb-2 font-medium">הצעד הבא</p>
            <p className="text-ink-700 leading-relaxed whitespace-pre-line">{result.nextStep}</p>
          </Card>

          {nextTool && (
            <Link href={`/tools/${nextTool.slug}`}>
              <Card className="hover:bg-sand-100 transition-colors group cursor-pointer">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Wrench className="size-5 text-clay-400" />
                    <div>
                      <p className="text-xs text-ink-400">כלי משלים</p>
                      <p className="font-medium text-ink-700">{nextTool.title}</p>
                    </div>
                  </div>
                  <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500" />
                </div>
              </Card>
            </Link>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleRestart} variant="outline" fullWidth>
              <RefreshCcw className="size-4" />
              להתחיל מחדש
            </Button>
            <Link href="/tools" className="flex-1">
              <Button variant="ghost" fullWidth>
                לעוד כלים
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="animate-fade-in">
      <PageHeader eyebrow={tool.chapterSource} title={tool.title} />

      <div className="px-5 space-y-5">
        <div className="flex items-center gap-2 -mt-2 mb-2">
          <Badge tone="clay">{tool.shortName ?? tool.title}</Badge>
          {tool.tier === "premium" && <Badge tone="premium">Premium</Badge>}
        </div>

        <Card tone="muted">
          <p className="text-xs text-ink-400 mb-2 font-medium">מתי משתמשים בכלי הזה?</p>
          <p className="text-ink-600 leading-relaxed">{tool.whenToUse}</p>
        </Card>

        <Quote source={tool.chapterSource}>{tool.bookExcerpt}</Quote>

        <div className="space-y-6 pt-4">
          {tool.fields.map((field) => (
            <ToolField
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={(v) => setValue(field.id, v)}
            />
          ))}
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} fullWidth size="lg" className="mt-4">
          לראות את השיקוף
          <ArrowLeft className="size-5" />
        </Button>
      </div>
    </main>
  );
}
