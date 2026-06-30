"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Card } from "@/components/ui/Card";
import { DIAGNOSIS_QUESTIONS } from "@/content/questions";
import { useAppStore } from "@/store/useAppStore";
import { scoreDiagnosis } from "@/lib/scoring";
import { track } from "@/services/analytics/providerFactory";

export default function DiagnosisPage() {
  const router = useRouter();
  const { segment, addDiagnosis } = useAppStore();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const question = DIAGNOSIS_QUESTIONS[index];
  const value = answers[question.id] ?? 0;

  const setValue = (v: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: v }));
  };

  const next = () => {
    if (index < DIAGNOSIS_QUESTIONS.length - 1) {
      track("diagnosis_question_answered", { index, value });
      setIndex((i) => i + 1);
    } else {
      const result = scoreDiagnosis(answers, segment ?? "dating");
      addDiagnosis(result);
      track("diagnosis_completed", {
        dominantVoice: result.dominantVoice,
      });
      track("dominant_voice_detected", { voice: result.dominantVoice });
      router.push("/diagnosis/result");
    }
  };

  const back = () => {
    if (index === 0) router.back();
    else setIndex((i) => i - 1);
  };

  const progress = ((index + 1) / DIAGNOSIS_QUESTIONS.length) * 100;

  return (
    <main className="animate-fade-in">
      <PageHeader
        eyebrow={`שאלה ${index + 1} מתוך ${DIAGNOSIS_QUESTIONS.length}`}
        title="מי אוחז בהגה אצלך?"
      />

      <div className="mx-5 mb-6 h-1 bg-sand-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-clay-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="px-5">
        <Card tone="warm" className="mb-6 animate-rise">
          <p className="font-serif text-xl text-ink-700 leading-relaxed">
            {question.text}
          </p>
        </Card>

        <Slider
          value={value}
          onChange={setValue}
          min={1}
          max={5}
          labels={["ממש לא נכון לגביי", "מאוד נכון לגביי"]}
        />

        <div className="mt-10 flex gap-3">
          <Button onClick={back} variant="outline" size="lg" fullWidth>
            <ArrowRight className="size-4" />
            הקודמת
          </Button>
          <Button onClick={next} disabled={!value} size="lg" fullWidth>
            {index === DIAGNOSIS_QUESTIONS.length - 1 ? "סיים" : "הבאה"}
            <ArrowLeft className="size-4" />
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-ink-300">
          זה לא מבחן. אין פה ציון על מי שאתה. רק מראה.
        </p>
      </div>
    </main>
  );
}
