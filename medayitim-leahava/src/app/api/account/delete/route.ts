import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Deletes the authenticated user's account.
 *
 * 1. Deletes the user's rows from all data tables using the user's own
 *    (RLS-scoped) session — so even without a service-role key the data goes.
 * 2. If a service-role key is configured, deletes the auth user itself
 *    (which also cascades the data via FK on delete cascade).
 * 3. Signs the user out to clear the session cookies.
 *
 * The service-role key is only ever read on the server (see admin.ts).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 1. Delete the user's own data (RLS + explicit user_id scoping).
  const tables = [
    "weekly_maintenance",
    "tool_entries",
    "situations",
    "profiles",
  ] as const;

  for (const table of tables) {
    const column = table === "profiles" ? "id" : "user_id";
    const { error } = await supabase.from(table).delete().eq(column, user.id);
    if (error) {
      return NextResponse.json(
        { error: "data_deletion_failed", table },
        { status: 500 },
      );
    }
  }

  // 2. Delete the auth user (requires service role). Degrade gracefully.
  let authDeleted = false;
  const admin = createAdminClient();
  if (admin) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    authDeleted = !error;
  }

  // 3. Clear the session cookies regardless.
  await supabase.auth.signOut();

  return NextResponse.json({ dataDeleted: true, authDeleted });
}
