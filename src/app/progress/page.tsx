"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Quote } from "@/components/ui/Quote";
import { useAppStore, countCatches } from "@/store/useAppStore";
import { VOICES } from "@/content/voices";
import { STATIONS } from "@/content/stations";
import { findTool } from "@/content/tools";

export default function ProgressPage() {
  const {
    diagnosisHistory,
    toolUsage,
    catches,
    completedStations,
    maintenance,
    reset,
  } = useAppStore();

  const latest = diagnosisHistory[0];
  const catchCounts = countCatches(catches);
  const uniqueToolsUsed = new Set(toolUsage.map((u) => u.toolSlug));

  const handleReset = () => {
    if (window.confirm("למחוק הכול? פעולה לא הפיכה.")) {
      reset();
      window.location.href = "/onboarding";
    }
  };

  return (
    <main className="animate-fade-in">
      <PageHeader
        eyebrow="התקדמות"
        title="איפה אתה עומד עכשיו"
        description="לא ציון. רק תנועה."
        showBack={false}
      />

      <div className="px-5 space-y-5 pb-8">
        {!latest && (
          <Card tone="warm">
            <p className="text-ink-600 mb-4">
              עוד לא עשית אבחון. זה המקום להתחיל.
            </p>
            <Link href="/diagnosis">
              <Button fullWidth>התחל אבחון</Button>
            </Link>
          </Card>
        )}

        {latest && (
          <Card tone="highlight">
            <p className="text-xs text-clay-500 mb-2 font-medium">הקול הדומיננטי באבחון האחרון</p>
            <p className="font-serif text-xl text-ink-700">
              {VOICES[latest.dominantVoice].name}
            </p>
            <p className="text-xs text-ink-400 mt-2">
              {new Date(latest.takenAt).toLocaleDateString("he-IL")}
            </p>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          <Card className="text-center">
            <p className="text-2xl font-serif text-ink-700">{catchCounts.before}</p>
            <p className="text-xs text-ink-400 mt-1">תפסתי לפני</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-serif text-ink-700">{catchCounts.during}</p>
            <p className="text-xs text-ink-400 mt-1">תוך כדי</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-serif text-ink-700">{catchCounts.after}</p>
            <p className="text-xs text-ink-400 mt-1">אחרי</p>
          </Card>
        </div>

        <Card>
          <div className="flex justify-between items-baseline mb-3">
            <p className="font-medium text-ink-700">תחנות שהשלמתי</p>
            <p className="text-xs text-ink-400">
              {completedStations.length} מתוך {STATIONS.length}
            </p>
          </div>
          <div className="flex gap-1">
            {STATIONS.map((s) => (
              <div
                key={s.id}
                className={`flex-1 h-2 rounded-full ${
                  completedStations.includes(s.id) ? "bg-sage-300" : "bg-sand-200"
                }`}
                title={s.title}
              />
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-baseline mb-3">
            <p className="font-medium text-ink-700">כלים שתרגלתי</p>
            <p className="text-xs text-ink-400">{uniqueToolsUsed.size} כלים שונים</p>
          </div>
          {toolUsage.length === 0 ? (
            <p className="text-sm text-ink-400">
              עוד לא תרגלת כלי. כל כלי שתפתח ותמלא יופיע כאן.
            </p>
          ) : (
            <div className="space-y-1">
              {Array.from(uniqueToolsUsed)
                .slice(0, 5)
                .map((slug) => {
                  const t = findTool(slug);
                  return t ? (
                    <Link
                      key={slug}
                      href={`/tools/${slug}`}
                      className="block text-sm text-ink-500 hover:text-ink-700 py-1"
                    >
                      ← {t.title}
                    </Link>
                  ) : null;
                })}
            </div>
          )}
        </Card>

        {maintenance.length > 0 && (
          <Card>
            <p className="font-medium text-ink-700 mb-2">תחזוקת ה־20</p>
            <p className="text-xs text-ink-400">
              {maintenance.length} שיחות שבועיות שמרת
            </p>
          </Card>
        )}

        <Quote source="פרק 1" className="pt-4">
          כל פעם שאתם מזהים את הדפוס אחרי שכבר פעל — אתם מקצרים את הזמן עד שתזהו אותו תוך כדי.
        </Quote>

        <div className="pt-6 border-t border-sand-200">
          <p className="text-xs text-ink-400 mb-3">פרטיות וזיכרון</p>
          <Button onClick={handleReset} variant="ghost" size="sm">
            <Trash2 className="size-3.5" />
            למחוק את כל מה שנשמר במכשיר
          </Button>
        </div>
      </div>
    </main>
  );
}
