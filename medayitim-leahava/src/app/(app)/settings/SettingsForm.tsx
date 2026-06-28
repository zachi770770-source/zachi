"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SaveButton } from "@/components/ui/SaveButton";
import { RELATIONSHIP_STAGES } from "@/lib/types";

export function SettingsForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, relationship_stage")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      setEmail(user.email ?? "");
      setFullName(profile?.full_name ?? "");
      setStage(profile?.relationship_stage ?? "");
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName.trim() || null,
      relationship_stage: stage || null,
    });

    if (upsertError) {
      setError("שמירת ההגדרות נכשלה. נסו שוב.");
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-clay-500">טוען…</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <Input label="אימייל" type="email" value={email} dir="ltr" disabled />
          <Input
            label="שם לתצוגה"
            value={fullName}
            onChange={(e) => {
              setSaved(false);
              setFullName(e.target.value);
            }}
            placeholder="איך לקרוא לך?"
          />
          <Select
            label="שלב בקשר"
            options={RELATIONSHIP_STAGES}
            value={stage}
            placeholder="בחרו שלב"
            onChange={(e) => {
              setSaved(false);
              setStage(e.target.value);
            }}
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div>
            <SaveButton
              saving={saving}
              saved={saved}
              label="שמירת הגדרות"
              savedLabel="נשמר ✓"
            />
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink-900">חשבון</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="secondary" onClick={handleSignOut} type="button">
            התנתקות
          </Button>
          <Button variant="danger" type="button" disabled aria-disabled="true">
            מחיקת חשבון (בקרוב)
          </Button>
        </div>
        <p className="mt-3 text-xs text-clay-500">
          מחיקת חשבון תתאפשר בקרוב. עד אז אפשר לפנות אלינו לבקשת מחיקה.
        </p>
      </Card>
    </div>
  );
}
