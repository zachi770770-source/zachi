"use client";

import { useState } from "react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { SaveButton } from "@/components/ui/SaveButton";
import { useSaveToolEntry } from "@/lib/useSaveToolEntry";
import { SAFETY_NOTE } from "@/lib/tools";

export default function SeventyTwoHoursPage() {
  const { save, saving, error } = useSaveToolEntry();

  const [whatHappened, setWhatHappened] = useState("");
  const [myPart, setMyPart] = useState("");
  const [whatHurt, setWhatHurt] = useState("");
  const [toSay, setToSay] = useState("");
  const [repair, setRepair] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const canSave = whatHappened.trim() && myPart.trim() && toSay.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) {
      setFormError(
        "כדאי למלא לפחות 'מה קרה', 'מה החלק שלי' ו'מה אני צריך לומר'.",
      );
      return;
    }
    setFormError(null);
    save({
      toolName: "72-hours",
      data: { whatHappened, myPart, whatHurt, toSay, repair },
      summary: `נוהל 72 שעות · תיקון: ${(repair.trim() || toSay.trim()).slice(0, 80)}`,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader
        title="נוהל 72 שעות"
        intro="אחרי ריב, הרגש עוד גבוה. הכלי הזה עוזר לעצור, לקחת אחריות על החלק שלי, ולמצוא דרך רגועה לחזור לשיחה — בלי לתקוף ובלי להיעלם."
      />

      {/* Safety warning */}
      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm leading-relaxed text-amber-900">
          אם יש אלימות, השפלה, פחד או שליטה — לא משתמשים בכלי הזה כדי להישאר.
          פונים לעזרה מקצועית. {SAFETY_NOTE}
        </p>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <Textarea
            label="מה קרה?"
            value={whatHappened}
            onChange={(e) => setWhatHappened(e.target.value)}
            rows={3}
            placeholder="תיאור קצר ועובדתי של מה שקרה."
          />
          <Textarea
            label="מה החלק שלי?"
            hint="לא להלקות את עצמי — רק לזהות את חלקי בכנות."
            value={myPart}
            onChange={(e) => setMyPart(e.target.value)}
            rows={3}
          />
          <Textarea
            label="מה נפגע בי?"
            value={whatHurt}
            onChange={(e) => setWhatHurt(e.target.value)}
            rows={3}
          />
          <Textarea
            label="מה אני צריך/ה לומר בלי לתקוף?"
            hint="מנוסח בגוף ראשון: 'אני הרגשתי…', 'אני צריך/ה…'."
            value={toSay}
            onChange={(e) => setToSay(e.target.value)}
            rows={3}
          />
          <Textarea
            label="מה תיקון קטן שאפשר לעשות?"
            value={repair}
            onChange={(e) => setRepair(e.target.value)}
            rows={3}
            placeholder="צעד קטן וריאלי לקראת חזרה לחיבור."
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
    </div>
  );
}
