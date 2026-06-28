"use client";

import { useEffect, useState } from "react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { SaveButton } from "@/components/ui/SaveButton";
import { createClient } from "@/lib/supabase/client";
import { currentWeekStart, formatHebrewDate } from "@/lib/format";

const ITEMS = [
  "מחווה קטנה",
  "שיחה קצרה בלי מסכים",
  "תודה אחת",
  "שאלה אחת אמיתית",
  "תיקון קטן שלא דוחים",
] as const;

export default function Maintenance20Page() {
  const supabase = createClient();
  const weekStart = currentWeekStart();

  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    Object.fromEntries(ITEMS.map((i) => [i, false])),
  );
  const [reflection, setReflection] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load this week's check-in if one already exists.
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("weekly_maintenance")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .maybeSingle();

      if (!active) return;
      if (loadError) {
        setError("טעינת הצ׳ק-אין השבועי נכשלה.");
      } else if (data) {
        setExistingId(data.id);
        setChecklist({
          ...Object.fromEntries(ITEMS.map((i) => [i, false])),
          ...(data.checklist ?? {}),
        });
        setReflection(data.reflection ?? "");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase, weekStart]);

  function toggle(item: string) {
    setSaved(false);
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("יש להתחבר מחדש.");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      week_start: weekStart,
      checklist,
      reflection: reflection.trim() || null,
    };

    const query = existingId
      ? supabase
          .from("weekly_maintenance")
          .update(payload)
          .eq("id", existingId)
          .eq("user_id", user.id)
          .select("id")
          .single()
      : supabase
          .from("weekly_maintenance")
          .insert(payload)
          .select("id")
          .single();

    const { data, error: saveError } = await query;

    if (saveError) {
      setError("השמירה נכשלה. נסו שוב בעוד רגע.");
    } else {
      if (data) setExistingId(data.id);
      setSaved(true);
    }
    setSaving(false);
  }

  const completed = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader
        title="תחזוקת ה־20"
        intro="קשר קיים נשמר בהרבה מחוות קטנות, לא במאמץ אחד גדול. הנה חמש פעולות קצרות לשבוע הקרוב."
      >
        <p className="text-sm text-clay-500">
          שבוע שמתחיל ב־{formatHebrewDate(weekStart)} · הושלמו {completed}/
          {ITEMS.length}
        </p>
      </ToolHeader>

      {loading ? (
        <Card>
          <p className="text-sm text-clay-500">טוען…</p>
        </Card>
      ) : (
        <>
          <Card>
            <ul className="flex flex-col gap-2">
              {ITEMS.map((item) => {
                const checked = checklist[item];
                return (
                  <li key={item}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-sand-200 p-3 transition-colors hover:bg-sand-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(item)}
                        className="h-5 w-5 accent-[var(--color-sage-500)]"
                      />
                      <span
                        className={`text-ink-800 ${
                          checked ? "text-clay-500 line-through" : ""
                        }`}
                      >
                        {item}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <Textarea
              label="שיקוף לשבוע (אופציונלי)"
              value={reflection}
              onChange={(e) => {
                setSaved(false);
                setReflection(e.target.value);
              }}
              rows={3}
              placeholder="מה עבד טוב? מה הייתי רוצה לחזק?"
            />
          </Card>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div>
            <SaveButton
              saving={saving}
              saved={saved}
              onClick={handleSave}
              type="button"
              label="שמירת הצ׳ק-אין השבועי"
              savedLabel="נשמר ✓"
            />
          </div>
        </>
      )}
    </div>
  );
}
