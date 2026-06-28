import { createClient } from "@/lib/supabase/server";
import { getJournalItems } from "@/lib/journal";
import { JournalList } from "./JournalList";

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const items = await getJournalItems(supabase, user!.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">יומן קשר</h1>
        <p className="max-w-2xl text-ink-700">
          כאן נאספים כל המצבים, התובנות והבדיקות שלך. זהו מרחב פרטי לחזור אליו
          ולראות את הדרך.
        </p>
      </header>

      <JournalList items={items} />
    </div>
  );
}
