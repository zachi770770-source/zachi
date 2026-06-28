"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error("delete failed");
      // Clear any client-side session state, then leave the app.
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setDeleteError("מחיקת החשבון נכשלה. נסו שוב בעוד רגע.");
      setDeleting(false);
    }
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

      {/* Data export */}
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">הנתונים שלי</h2>
        <p className="mt-2 text-sm text-ink-700">
          אפשר לייצא עותק של כל הנתונים שלך (פרופיל, מצבים, תשובות לכלים ויומן)
          כקובץ JSON. הקובץ כולל אך ורק את הנתונים של החשבון שלך.
        </p>
        <div className="mt-4">
          <a
            href="/api/account/export"
            download
            className="inline-flex items-center justify-center gap-2 rounded-full border border-sand-300 bg-sand-100 px-6 py-2.5 text-base font-medium text-ink-800 transition-colors hover:bg-sand-200"
          >
            ייצוא היומן (JSON)
          </a>
        </div>
      </Card>

      {/* Account */}
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">חשבון</h2>
        <div className="mt-4">
          <Button variant="secondary" onClick={handleSignOut} type="button">
            התנתקות
          </Button>
        </div>

        <div className="mt-6 border-t border-sand-200 pt-5">
          <h3 className="font-semibold text-ink-900">מחיקת חשבון</h3>
          <p className="mt-1 text-sm text-ink-700">
            מחיקת החשבון מוחקת לצמיתות את הפרופיל, המצבים, תשובות הכלים והיומן
            שלך. הפעולה אינה הפיכה.
          </p>

          {!confirmingDelete ? (
            <div className="mt-4">
              <Button
                variant="danger"
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmText("");
                  setConfirmingDelete(true);
                }}
              >
                מחיקת חשבון
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                כדי לאשר, הקלידו את המילה <span className="font-bold">מחיקה</span>{" "}
                בשדה הבא:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="מחיקה"
                aria-label="אישור מחיקה"
              />
              {deleteError && (
                <p className="text-sm text-red-700">{deleteError}</p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="danger"
                  type="button"
                  disabled={confirmText.trim() !== "מחיקה" || deleting}
                  onClick={handleDeleteAccount}
                >
                  {deleting ? "מוחק…" : "מחיקה לצמיתות"}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmingDelete(false)}
                >
                  ביטול
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Trust links */}
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">מידע ובטיחות</h2>
        <nav className="mt-3 flex flex-col gap-2 text-sm">
          <Link href="/privacy" className="text-clay-600 hover:underline">
            מדיניות פרטיות
          </Link>
          <Link href="/terms" className="text-clay-600 hover:underline">
            תנאי שימוש
          </Link>
          <Link href="/help" className="text-clay-600 hover:underline">
            קבלת עזרה מקצועית ובטיחותית
          </Link>
        </nav>
      </Card>
    </div>
  );
}
