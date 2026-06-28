"use client";

import { useMemo, useState } from "react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { Card } from "@/components/ui/Card";
import { RatingScale } from "@/components/ui/RatingScale";
import { SaveButton } from "@/components/ui/SaveButton";
import { useSaveToolEntry } from "@/lib/useSaveToolEntry";

interface Category {
  key: string;
  title: string;
  questions: string[];
}

const CATEGORIES: Category[] = [
  {
    key: "consistency",
    title: "עקביות",
    questions: [
      "המעשים תואמים את המילים לאורך זמן.",
      "אני יודע/ת פחות או יותר למה לצפות.",
      "ההתנהגות יציבה, לא רק בהתחלה.",
    ],
  },
  {
    key: "presence",
    title: "נוכחות",
    questions: [
      "כשאנחנו יחד, יש תחושה של נוכחות אמיתית.",
      "מקשיבים לי באמת, לא רק שומעים.",
      "אני מרגיש/ה שרואים אותי.",
    ],
  },
  {
    key: "responsibility",
    title: "אחריות",
    questions: [
      "יש נכונות לקחת אחריות על טעויות.",
      "לא הכול מתגלגל אליי או אל אחרים.",
      "מילים מתורגמות למעשים אחראיים.",
    ],
  },
  {
    key: "truth",
    title: "יכולת לדבר אמת",
    questions: [
      "אפשר לומר דברים קשים ולהישאר בקשר.",
      "אני לא צריך/ה להסתיר את מה שאני באמת חושב/ת.",
      "יש מקום לאי-הסכמה בלי איום.",
    ],
  },
  {
    key: "repair",
    title: "התקרבות אחרי קושי",
    questions: [
      "אחרי ריב יש דרך לחזור ולהתקרב.",
      "הקושי לא הופך לקרח ממושך.",
      "מישהו עושה צעד לקראת תיקון.",
    ],
  },
];

const TOTAL_QUESTIONS = CATEGORIES.reduce(
  (n, c) => n + c.questions.length,
  0,
);

function resultText(avg: number): string {
  if (avg >= 4) return "יש כאן סימנים טובים לקרקע לבנייה.";
  if (avg >= 3) return "יש כאן פוטנציאל, אבל כדאי להמשיך לבדוק בקצב רגוע.";
  return "יש כאן נקודות שדורשות תשומת לב וזהירות.";
}

export default function ThreeGatesPage() {
  const { save, saving, error } = useSaveToolEntry();
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === TOTAL_QUESTIONS;

  const { average, perCategory } = useMemo(() => {
    const values = Object.values(answers);
    const average =
      values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;

    const perCategory = CATEGORIES.map((cat) => {
      const catVals = cat.questions
        .map((_, i) => answers[`${cat.key}-${i}`])
        .filter((v): v is number => typeof v === "number");
      const catAvg =
        catVals.length > 0
          ? catVals.reduce((a, b) => a + b, 0) / catVals.length
          : 0;
      return { title: cat.title, average: catAvg, count: catVals.length };
    });

    return { average, perCategory };
  }, [answers]);

  function setAnswer(key: string, value: number) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!allAnswered) return;
    save({
      toolName: "three-gates",
      data: {
        answers,
        average: Number(average.toFixed(2)),
        perCategory,
      },
      summary: `ממוצע ${average.toFixed(1)} — ${resultText(average)}`,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader
        title="מבחן שלושת השערים"
        intro="השאלה אינה רק אם יש משיכה, אלא אם יש קרקע שאפשר לבנות עליה."
      />

      {CATEGORIES.map((cat) => (
        <Card key={cat.key}>
          <h2 className="text-lg font-semibold text-ink-900">{cat.title}</h2>
          <div className="mt-4 flex flex-col gap-5">
            {cat.questions.map((q, i) => (
              <RatingScale
                key={`${cat.key}-${i}`}
                label={q}
                value={answers[`${cat.key}-${i}`] ?? null}
                onChange={(v) => setAnswer(`${cat.key}-${i}`, v)}
                min={1}
                max={5}
                minLabel="כלל לא"
                maxLabel="מאוד"
              />
            ))}
          </div>
        </Card>
      ))}

      {/* Result */}
      <Card className="bg-sage-100/60">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">התמונה המצטברת</h2>
          <span className="text-sm text-clay-500">
            {answeredCount}/{TOTAL_QUESTIONS} שאלות
          </span>
        </div>

        {allAnswered ? (
          <>
            <p className="mt-3 text-2xl font-bold text-ink-900">
              {average.toFixed(1)}
              <span className="mr-1 text-base font-normal text-clay-500">
                {" "}
                / 5
              </span>
            </p>
            <p className="mt-2 text-ink-800">{resultText(average)}</p>
            <ul className="mt-4 space-y-1 text-sm text-ink-700">
              {perCategory.map((c) => (
                <li key={c.title} className="flex justify-between">
                  <span>{c.title}</span>
                  <span className="text-clay-600">{c.average.toFixed(1)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-clay-500">
              זהו מבט עזר לחשיבה, לא קביעה לגבי הקשר. אתם מכירים את ההקשר
              המלא.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-clay-500">
            ענו על כל השאלות כדי לראות את התמונה המצטברת.
          </p>
        )}

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
            label="שמירת הבדיקה ביומן"
          />
        </div>
      </Card>
    </div>
  );
}
