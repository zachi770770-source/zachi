import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exports the authenticated user's data as a downloadable JSON file.
 * Every query is scoped by the user's id (RLS + explicit filter), so the
 * export can only ever contain the current user's own records.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [profile, situations, toolEntries, weeklyMaintenance] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("situations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("tool_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("weekly_maintenance")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: true }),
    ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: profile.data ?? null,
    situations: situations.data ?? [],
    tool_entries: toolEntries.data ?? [],
    weekly_maintenance: weeklyMaintenance.data ?? [],
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="medayitim-leahava-export-${date}.json"`,
    },
  });
}
