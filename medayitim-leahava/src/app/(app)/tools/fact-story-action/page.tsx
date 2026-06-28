"use client";

import { useState } from "react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { SaveButton } from "@/components/ui/SaveButton";
import { useSaveToolEntry } from "@/lib/useSaveToolEntry";

export default function FactStoryActionPage() {
  const { save, saving, error } = useSaveToolEntry();

  const [fact, setFact] = useState("");
  const [story, setStory] = useState("");
  const [alternative, setAlternative] = useState("");
  const [action, setAction] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const canSave = fact.trim() && story.trim() && action.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) {
      setFormError("כדאי למלא לפחות את העובדה, הסיפור והפעולה.");
      return;
    }
    setFormError(null);
    save({
      toolName: "fact-story-action",
      data: { fact, story, alternative, action },
      summary: `עובדה: ${fact.trim()} · פעולה: ${action.trim()}`,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader
        title="עובדה·סיפור·פעולה"
        intro="כשמשהו בקשר מפעיל אותנו, המטרה היא להפריד בין מה שקרה, מה שסיפרנו לעצמנו, ומה נכון לעשות עכשיו."
      />

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <Textarea
            label="העובדה — מה קרה בפועל?"
            hint="רק עובדות שניתן לצלם במצלמה, בלי פרשנות."
            value={fact}
            onChange={(e) => setFact(e.target.value)}
            rows={3}
            placeholder="לדוגמה: לא קיבלתי תשובה להודעה במשך יום."
          />
          <Textarea
            label="הסיפור — מה המוח שלי אומר שזה אומר?"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={3}
            placeholder="הפרשנות שעולה אוטומטית…"
          />
          <Textarea
            label="אפשרות נוספת — איזה הסבר נוסף יכול להיות?"
            hint="אופציונלי. הסבר אחר, סביר באותה מידה."
            value={alternative}
            onChange={(e) => setAlternative(e.target.value)}
            rows={3}
            placeholder="הסבר אפשרי אחר…"
          />
          <Textarea
            label="הפעולה — מה פעולה בוגרת, נקייה ולא אימפולסיבית?"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            rows={3}
            placeholder="צעד אחד קטן ובוגר…"
          />

          {(formError || error) && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError || error}
            </p>
          )}

          <div>
            <SaveButton saving={saving} disabled={!canSave} />
          </div>
        </form>
      </Card>

      {/* Live summary preview */}
      {canSave && (
        <Card className="bg-sage-100/60">
          <h2 className="text-lg font-semibold text-ink-900">תמצית</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="font-medium text-clay-600">העובדה</dt>
              <dd className="text-ink-800">{fact}</dd>
            </div>
            <div>
              <dt className="font-medium text-clay-600">הסיפור</dt>
              <dd className="text-ink-800">{story}</dd>
            </div>
            {alternative.trim() && (
              <div>
                <dt className="font-medium text-clay-600">אפשרות נוספת</dt>
                <dd className="text-ink-800">{alternative}</dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-clay-600">הפעולה הבוגרת</dt>
              <dd className="text-ink-800">{action}</dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  );
}
