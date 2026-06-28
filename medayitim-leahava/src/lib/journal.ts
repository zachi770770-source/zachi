import type { SupabaseClient } from "@supabase/supabase-js";
import type { JournalItem, Situation, ToolEntry } from "./types";
import { toolTitle } from "./tools";

/**
 * Fetch and merge the user's situations and tool entries into a single,
 * date-sorted journal feed. RLS guarantees only the user's own rows return.
 */
export async function getJournalItems(
  supabase: SupabaseClient,
  limit?: number,
): Promise<JournalItem[]> {
  const [situationsRes, entriesRes] = await Promise.all([
    supabase
      .from("situations")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("tool_entries")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const situations = (situationsRes.data ?? []) as Situation[];
  const entries = (entriesRes.data ?? []) as ToolEntry[];

  const items: JournalItem[] = [
    ...situations.map(
      (s): JournalItem => ({
        id: s.id,
        kind: "situation",
        title: s.title || "מצב ללא כותרת",
        subtitle: s.content,
        relationship_stage: s.relationship_stage,
        tool_name: null,
        created_at: s.created_at,
      }),
    ),
    ...entries.map(
      (e): JournalItem => ({
        id: e.id,
        kind: "tool",
        title: toolTitle(e.tool_name),
        subtitle: e.summary,
        relationship_stage: null,
        tool_name: toolTitle(e.tool_name),
        created_at: e.created_at,
      }),
    ),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return typeof limit === "number" ? items.slice(0, limit) : items;
}
