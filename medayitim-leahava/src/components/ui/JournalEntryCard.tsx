import Link from "next/link";
import type { JournalItem } from "@/lib/types";
import { formatHebrewDate } from "@/lib/format";

const KIND_LABEL: Record<JournalItem["kind"], string> = {
  situation: "מצב",
  tool: "כלי",
};

export function JournalEntryCard({ item }: { item: JournalItem }) {
  return (
    <Link
      href={`/journal/${item.kind}-${item.id}`}
      className="block rounded-[var(--radius-card)] border border-sand-200 bg-white p-5 shadow-[0_2px_16px_rgba(126,100,81,0.06)] transition-colors hover:border-clay-400"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-clay-600">
          {item.tool_name ?? KIND_LABEL[item.kind]}
        </span>
        <time className="text-xs text-clay-500">
          {formatHebrewDate(item.created_at)}
        </time>
      </div>
      <h3 className="mt-3 line-clamp-2 text-base font-semibold text-ink-900">
        {item.title}
      </h3>
      {item.subtitle && (
        <p className="mt-1 line-clamp-2 text-sm text-ink-700">{item.subtitle}</p>
      )}
      {item.relationship_stage && (
        <p className="mt-3 text-xs text-clay-500">
          שלב: {item.relationship_stage}
        </p>
      )}
    </Link>
  );
}
