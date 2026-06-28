"use client";

import { useMemo, useState } from "react";
import type { JournalItem } from "@/lib/types";
import { RELATIONSHIP_STAGES } from "@/lib/types";
import { JournalEntryCard } from "@/components/ui/JournalEntryCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

const ALL = "all";

export function JournalList({ items }: { items: JournalItem[] }) {
  const [toolFilter, setToolFilter] = useState(ALL);
  const [stageFilter, setStageFilter] = useState(ALL);
  const [sort, setSort] = useState<"new" | "old">("new");

  // Distinct labels for the "by tool" filter (tool titles + situations).
  const toolOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.tool_name ?? "מצב"));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    const list = items.filter((i) => {
      const label = i.tool_name ?? "מצב";
      if (toolFilter !== ALL && label !== toolFilter) return false;
      if (stageFilter !== ALL && i.relationship_stage !== stageFilter)
        return false;
      return true;
    });
    list.sort((a, b) =>
      sort === "new"
        ? b.created_at.localeCompare(a.created_at)
        : a.created_at.localeCompare(b.created_at),
    );
    return list;
  }, [items, toolFilter, stageFilter, sort]);

  const selectClass =
    "rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:outline-none";

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-clay-500">
          לפי כלי
          <select
            className={selectClass}
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
          >
            <option value={ALL}>הכול</option>
            {toolOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-clay-500">
          לפי שלב בקשר
          <select
            className={selectClass}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value={ALL}>הכול</option>
            {RELATIONSHIP_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-clay-500">
          לפי תאריך
          <select
            className={selectClass}
            value={sort}
            onChange={(e) => setSort(e.target.value as "new" | "old")}
          >
            <option value="new">מהחדש לישן</option>
            <option value="old">מהישן לחדש</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        items.length === 0 ? (
          <EmptyState
            title="היומן עדיין ריק"
            description="כל מצב או כלי שתעבדו יישמרו כאן."
            action={<LinkButton href="/situation">להתחיל מהמצב הנוכחי</LinkButton>}
          />
        ) : (
          <EmptyState
            title="אין רשומות שמתאימות לסינון"
            description="נסו לשנות את הסינון כדי לראות עוד."
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((item) => (
            <JournalEntryCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
