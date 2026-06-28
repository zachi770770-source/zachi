import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { formatHebrewDateTime } from "@/lib/format";
import { toolTitle } from "@/lib/tools";
import type { Situation, ToolEntry } from "@/lib/types";

/** Human-readable labels for the jsonb keys stored by each tool. */
const FIELD_LABELS: Record<string, string> = {
  fact: "העובדה",
  story: "הסיפור",
  alternative: "אפשרות נוספת",
  action: "הפעולה הבוגרת",
  whatHappened: "מה קרה",
  myPart: "מה החלק שלי",
  whatHurt: "מה נפגע בי",
  toSay: "מה אני צריך/ה לומר",
  repair: "תיקון קטן",
  reflection: "שיקוף",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-clay-600">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-ink-800">{value}</dd>
    </div>
  );
}

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sep = id.indexOf("-");
  const kind = id.slice(0, sep);
  const realId = id.slice(sep + 1);

  if (kind !== "situation" && kind !== "tool") notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  if (kind === "situation") {
    const { data } = await supabase
      .from("situations")
      .select("*")
      .eq("id", realId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) notFound();
    const s = data as Situation;

    return (
      <Article date={s.created_at} badge="מצב" title={s.title}>
        <dl className="flex flex-col gap-4">
          <DetailRow label="מה קרה" value={s.content} />
          {s.relationship_stage && (
            <DetailRow label="שלב בקשר" value={s.relationship_stage} />
          )}
          {typeof s.emotional_intensity === "number" && (
            <DetailRow
              label="עוצמה רגשית"
              value={`${s.emotional_intensity} / 10`}
            />
          )}
          {s.suggested_tool && (
            <div>
              <dt className="text-sm font-medium text-clay-600">כלי שהוצע</dt>
              <dd className="mt-1">
                <Link
                  href={`/tools/${s.suggested_tool}`}
                  className="text-clay-600 hover:underline"
                >
                  {toolTitle(s.suggested_tool)}
                </Link>
              </dd>
            </div>
          )}
        </dl>
      </Article>
    );
  }

  const { data } = await supabase
    .from("tool_entries")
    .select("*")
    .eq("id", realId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) notFound();
  const entry = data as ToolEntry;
  const entries = Object.entries(entry.data ?? {});

  return (
    <Article
      date={entry.created_at}
      badge={toolTitle(entry.tool_name)}
      title={toolTitle(entry.tool_name)}
    >
      {entry.summary && (
        <p className="mb-5 rounded-xl bg-sage-100/60 px-4 py-3 text-ink-800">
          {entry.summary}
        </p>
      )}
      <dl className="flex flex-col gap-4">
        {entries
          .filter(([key]) => FIELD_LABELS[key])
          .map(([key, value]) => {
            const text =
              typeof value === "string"
                ? value
                : JSON.stringify(value);
            if (!text || text === "{}" || text === "null") return null;
            return (
              <DetailRow key={key} label={FIELD_LABELS[key]} value={text} />
            );
          })}
      </dl>
    </Article>
  );
}

function Article({
  date,
  badge,
  title,
  children,
}: {
  date: string;
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/journal" className="text-sm text-clay-500 hover:text-clay-600">
          → חזרה ליומן
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-clay-600">
            {badge}
          </span>
          <time className="text-xs text-clay-500">
            {formatHebrewDateTime(date)}
          </time>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-ink-900">{title}</h1>
      </div>

      <Card>{children}</Card>

      <div>
        <LinkButton href="/journal" variant="secondary">
          חזרה ליומן
        </LinkButton>
      </div>
    </div>
  );
}
