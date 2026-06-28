"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ToolSlug } from "@/lib/types";

interface SaveArgs {
  toolName: ToolSlug;
  data: Record<string, unknown>;
  summary: string;
}

/**
 * Shared hook used by every tool page to persist a tool_entry row.
 * Centralises auth check, loading/error state and the post-save redirect.
 */
export function useSaveToolEntry() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save({ toolName, data, summary }: SaveArgs) {
    setError(null);
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: row, error: insertError } = await supabase
      .from("tool_entries")
      .insert({
        user_id: user.id,
        tool_name: toolName,
        data,
        summary,
      })
      .select("id")
      .single();

    if (insertError) {
      setError("השמירה נכשלה. נסו שוב בעוד רגע.");
      setSaving(false);
      return;
    }

    router.push(`/journal/tool-${row.id}`);
    router.refresh();
  }

  return { save, saving, error };
}
