"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Quote } from "@/components/ui/Quote";
import { useAppStore } from "@/store/useAppStore";
import { buildMemoryCard } from "@/services/ai/memoryCard";
import { VOICES } from "@/content/voices";

export default function MemoryPage() {
  const appState = useAppStore();
  const [showRaw, setShowRaw] = useState(false);

  const card = buildMemoryCard({
    segment: appState.segment,
    diagnosisHistory: appState.diagnosisHistory,
    toolUsage: appState.toolUsage,
    catches: appState.catches,
  });

  const handleReset = () => {
    if (window.confirm("למחוק את כל הזיכרון? פעולה לא הפיכה.")) {
      appState.reset();
      window.location.href = "/onboarding";
    }
  };

  return (
    <main className="animate-fade-in">
      <PageHeader
        eyebrow="פרטיות"
        title="מה המאמן זוכר עליי"
        description="כל המידע נשמר במכשיר שלך בלבד. אתה שולט בו."
      />

      <div className="px-5 space-y-5 pb-8">
        <Card>
          <h3 className="font-medium text-ink-700 mb-3">סיכום הזיכרון</h3>
          <dl className="space-y-2 text-sm">
            {card.segment && (
              <div className="flex justify-between">
                <dt className="text-ink-400">מסלול</dt>
                <dd className="text-ink-700">{card.segment}</dd>
              </div>
            )}
            {card.dominantVoice && (
              <div className="flex justify-between">
                <dt className="text-ink-400">קול דומיננטי באבחון האחרון</dt>
                <dd className="text-ink-700">
                  {VOICES[card.dominantVoice as keyof typeof VOICES]?.name ?? card.dominantVoice}
                </dd>
              </div>
            )}
            {card.daysSinceDiagnosis !== undefined && (
              <div className="flex justify-between">
                <dt className="text-ink-400">זמן מאז האבחון</dt>
                <dd className="text-ink-700">{card.daysSinceDiagnosis} ימים</dd>
              </div>
            )}
            {card.practicedToolSlugs.length > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400 shrink-0">כלים תרגלת</dt>
                <dd className="text-ink-700 text-end">{card.practicedToolSlugs.join(", ")}</dd>
              </div>
            )}
            {card.recentPatterns.length > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400 shrink-0">דפוסים שעלו לאחרונה</dt>
                <dd className="text-ink-700 text-end">{card.recentPatterns.join(", ")}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card tone="muted">
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-700"
          >
            {showRaw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {showRaw ? "הסתר נתונים גולמיים" : "הצג נתונים גולמיים (JSON)"}
          </button>
          {showRaw && (
            <pre className="mt-3 text-xs text-ink-500 bg-white p-3 rounded-xl overflow-x-auto" dir="ltr">
              {JSON.stringify(card, null, 2)}
            </pre>
          )}
        </Card>

        <Card tone="warm">
          <h3 className="font-medium text-ink-700 mb-2">פרטיות</h3>
          <p className="text-sm text-ink-500 leading-relaxed">
            ב-Phase 1, כל הזיכרון יושב במכשיר שלך. שום שרת לא רואה אותו.
            ב-Phase 2 (כשיצורף Auth), תהיה לך אפשרות להתחבר ולשמור גיבוי בענן —
            רק נתונים שלך, מוצפנים, וגם אז המחיקה מיידית.
          </p>
        </Card>

        <div className="pt-4 border-t border-sand-200">
          <Button onClick={handleReset} variant="ghost" size="sm">
            <Trash2 className="size-3.5" />
            למחוק את כל הזיכרון מהמכשיר
          </Button>
        </div>

        <Quote source="עיקרון פרטיות">
          המאמן זוכר את ההיסטוריה שלך כדי לתת מענה אישי. אתה יכול לבדוק או למחוק את הזיכרון בכל עת.
        </Quote>

        <Link href="/progress">
          <Button variant="outline" fullWidth>
            חזרה להתקדמות
          </Button>
        </Link>
      </div>
    </main>
  );
}
