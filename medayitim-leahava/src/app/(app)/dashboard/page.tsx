import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getJournalItems } from "@/lib/journal";
import { RELATIONSHIP_STAGES } from "@/lib/types";
import { TOOLS } from "@/lib/tools";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardTitle, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { JournalEntryCard } from "@/components/ui/JournalEntryCard";

const QUICK_TOOLS = ["fact-story-action", "three-gates"] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .maybeSingle();

  const recent = await getJournalItems(supabase, 3);

  const firstName = profile?.full_name?.split(" ")[0];

  const quickCards = [
    ...TOOLS.filter((t) => (QUICK_TOOLS as readonly string[]).includes(t.slug)),
    {
      slug: "journal",
      title: "יומן קשר",
      purpose: "כל המצבים והתובנות שלך במקום אחד.",
      href: "/journal",
    },
    {
      slug: "library",
      title: "ספריית הכלים",
      purpose: "כל הכלים לעבודה אישית, בכל שלב בקשר.",
      href: "/tools",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <section>
        <p className="text-sm text-clay-500">
          {firstName ? `שלום ${firstName},` : "שלום,"}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900 sm:text-3xl">
          איפה אתה נמצא עכשיו במסע?
        </h1>
      </section>

      {/* Stage status buttons */}
      <section className="flex flex-wrap gap-2">
        {RELATIONSHIP_STAGES.map((stage) => (
          <Link
            key={stage}
            href={`/situation?stage=${encodeURIComponent(stage)}`}
            className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm text-ink-800 transition-colors hover:border-clay-400 hover:bg-sand-100"
          >
            {stage}
          </Link>
        ))}
      </section>

      {/* Main CTA */}
      <section>
        <Card className="bg-clay-600 text-center">
          <h2 className="text-xl font-semibold text-sand-50">מה קורה עכשיו?</h2>
          <p className="mt-2 text-sand-100">
            ספר/י בקצרה מה עובר עליך, ונתאים לך כלי מתאים להמשך.
          </p>
          <div className="mt-5">
            <LinkButton href="/situation" variant="secondary" size="lg">
              נתחיל לעבד את המצב
            </LinkButton>
          </div>
        </Card>
      </section>

      {/* Quick access cards */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink-900">גישה מהירה</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickCards.map((c) => (
            <Link key={c.slug} href={c.href} className="block">
              <Card className="h-full transition-colors hover:border-clay-400">
                <CardTitle>{c.title}</CardTitle>
                <CardBody>{c.purpose}</CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent journal entries */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">מהיומן האחרון</h2>
          <Link href="/journal" className="text-sm text-clay-600 hover:underline">
            לכל היומן
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="היומן עדיין ריק"
            description="כל מצב או כלי שתעבדו יישמרו כאן, כדי שתוכלו לחזור ולראות את הדרך."
            action={
              <LinkButton href="/situation">להתחיל מהמצב הנוכחי</LinkButton>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recent.map((item) => (
              <JournalEntryCard key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
