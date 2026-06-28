"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RELATIONSHIP_STAGES, type RelationshipStage } from "@/lib/types";
import { TOOL_BY_SLUG, type ToolMeta } from "@/lib/tools";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { RatingScale } from "@/components/ui/RatingScale";
import { LinkButton } from "@/components/ui/Button";
import { SaveButton } from "@/components/ui/SaveButton";

/**
 * Suggests a relevant tool based on the reported stage and emotional intensity.
 * This is gentle orientation — never a directive about the relationship itself.
 */
function suggestTool(
  stage: string,
  intensity: number,
): { tool: ToolMeta; reason: string } | null {
  if (intensity >= 8) {
    return {
      tool: TOOL_BY_SLUG["fact-story-action"],
      reason: "כשהעוצמה הרגשית גבוהה, כדאי קודם להפריד בין עובדה לסיפור.",
    };
  }
  if (stage === "אחרי ריב") {
    return {
      tool: TOOL_BY_SLUG["72-hours"],
      reason: "אחרי ריב, נוהל 72 שעות עוזר לחזור לשיחה בקצב רגוע.",
    };
  }
  if (stage === "דייטים" || stage === "קשר מתהווה") {
    return {
      tool: TOOL_BY_SLUG["three-gates"],
      reason: "כשבודקים אם להעמיק קשר, מבחן שלושת השערים נותן מבט בהיר.",
    };
  }
  if (stage === "קשר קיים") {
    return {
      tool: TOOL_BY_SLUG["maintenance-20"],
      reason: "בקשר קיים, תחזוקת ה־20 שומרת על חיבור יומיומי.",
    };
  }
  return null;
}

export function SituationForm() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [stage, setStage] = useState<string>("");

  // Pre-select the stage from the ?stage= query param (set on the dashboard).
  // Read on the client so the form still renders on the server.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("stage");
    if (param && RELATIONSHIP_STAGES.includes(param as RelationshipStage)) {
      setStage(param);
    }
  }, []);

  const [intensity, setIntensity] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>(
    {},
  );

  const suggestion = useMemo(() => {
    if (!stage && intensity === null) return null;
    return suggestTool(stage, intensity ?? 0);
  }, [stage, intensity]);

  function validate() {
    const next: { title?: string; content?: string } = {};
    if (title.trim().length < 2) next.title = "כדאי לתת כותרת קצרה.";
    if (content.trim().length < 5)
      next.content = "כתבו כמה מילים על מה שקרה.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    setError(null);
    if (!validate()) return;

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("situations")
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        relationship_stage: stage || null,
        emotional_intensity: intensity,
        suggested_tool: suggestion?.tool.slug ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      setError("השמירה נכשלה. נסו שוב בעוד רגע.");
      setSaving(false);
      return;
    }

    router.push(`/journal/situation-${data.id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">
          מה קורה עכשיו?
        </h1>
        <p className="max-w-2xl text-ink-700">
          כתבו בכמה מילים את המצב. אין כאן נכון או לא נכון — רק מקום לעצור,
          לשים לב, ולבחור צעד בוגר.
        </p>
      </header>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="flex flex-col gap-5"
          noValidate
        >
          <Input
            label="מה קרה?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="כותרת קצרה למצב"
            error={errors.title}
          />
          <Textarea
            label="כתוב בכמה מילים את המצב"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="מה קרה, מה הרגשתי, מה מטריד אותי…"
            error={errors.content}
          />
          <Select
            label="שלב בקשר"
            options={RELATIONSHIP_STAGES}
            value={stage}
            placeholder="בחרו שלב"
            onChange={(e) => setStage(e.target.value)}
          />
          <RatingScale
            label="עוצמה רגשית (1–10)"
            value={intensity}
            onChange={setIntensity}
            min={1}
            max={10}
            minLabel="רגוע"
            maxLabel="מוצף"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div>
            <SaveButton saving={saving} label="שמירת המצב ביומן" />
          </div>
        </form>
      </Card>

      {/* Tool suggestion */}
      {suggestion && (
        <Card className="bg-sage-100/60">
          <p className="text-sm text-clay-600">כלי מוצע להמשך</p>
          <h2 className="mt-1 text-lg font-semibold text-ink-900">
            {suggestion.tool.title}
          </h2>
          <p className="mt-1 text-ink-700">{suggestion.reason}</p>
          <div className="mt-4">
            <LinkButton href={suggestion.tool.href}>
              לפתוח את הכלי
            </LinkButton>
          </div>
        </Card>
      )}
    </div>
  );
}
