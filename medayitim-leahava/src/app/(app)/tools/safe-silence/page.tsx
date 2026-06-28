"use client";

import { useState } from "react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { SaveButton } from "@/components/ui/SaveButton";
import { useSaveToolEntry } from "@/lib/useSaveToolEntry";

const QUESTIONS = [
  "האם השקט מרגיע אותי או מוחק אותי?",
  "האם יש תקשורת בסיסית גם כשלא מדברים הרבה?",
  "האם אני מרגיש/ה נוכח/ת בקשר?",
  "האם השקט הוא מנוחה או התרחקות?",
];

const OPTIONS = ["יותר לכיוון בטוח", "באמצע", "יותר לכיוון מת"] as const;

export default function SafeSilencePage() {
  const { save, saving, error } = useSaveToolEntry();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [reflection, setReflection] = useState("");

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  function handleSave() {
    if (!allAnswered) return;
    const safeLean = Object.values(answers).filter(
      (a) => a === OPTIONS[0],
    ).length;
    save({
      toolName: "safe-silence",
      data: { answers, reflection },
      summary:
        reflection.trim() ||
        `שיקוף על שקט בקשר (${safeLean}/${QUESTIONS.length} לכיוון שקט בטוח).`,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader
        title="שקט בטוח מול שקט מת"
        intro="לא כל שקט דומה. לפעמים שקט הוא מנוחה ובִּטחה, ולפעמים הוא התרחקות. כאן עוצרים להבחין — בעדינות, בלי אבחנה."
      />

      {QUESTIONS.map((q, i) => (
        <Card key={i}>
          <p className="font-medium text-ink-900">{q}</p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
            {OPTIONS.map((opt) => {
              const active = answers[i] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [i]: opt }))
                  }
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    active
                      ? "border-sage-600 bg-sage-500 text-white"
                      : "border-sand-300 bg-white text-ink-700 hover:border-sage-500"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </Card>
      ))}

      <Card>
        <Textarea
          label="מה עולה בי כשאני קורא/ת את התשובות שלי?"
          hint="אופציונלי — מקום לשיקוף חופשי."
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={4}
          placeholder="כמה מילים לעצמי…"
        />
      </Card>

      <Card className="bg-sage-100/60">
        <h2 className="text-lg font-semibold text-ink-900">שיקוף</h2>
        <p className="mt-2 text-ink-800">
          אין כאן תשובה נכונה. אם רוב התחושות נוטות לכיוון של מנוחה ונוכחות —
          ייתכן שהשקט הזה בטוח עבורך. אם הן נוטות לכיוון של מחיקה והתרחקות —
          אולי כדאי להקשיב לזה ולבדוק מה היית רוצה לבקש לעצמך.
        </p>
        <p className="mt-3 text-xs text-clay-500">
          זהו שיקוף לחשיבה אישית, לא אבחנה לגבי הקשר.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5">
          <SaveButton
            saving={saving}
            disabled={!allAnswered}
            onClick={handleSave}
            type="button"
            label="שמירת השיקוף ביומן"
          />
        </div>
      </Card>
    </div>
  );
}
