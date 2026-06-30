"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Check, Sparkles, Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Quote } from "@/components/ui/Quote";
import { Button } from "@/components/ui/Button";
import { findStation, STATIONS } from "@/content/stations";
import { findTool } from "@/content/tools";
import { useAppStore } from "@/store/useAppStore";
import { HEALTHY_PATTERNS } from "@/content/healthy";

export default function StationPage() {
  const params = useParams<{ station: string }>();

  if (params.station === "healthy") {
    return <HealthyView />;
  }

  const station = findStation(params.station);
  const { completeStation, completedStations } = useAppStore();

  if (!station) notFound();

  const isDone = completedStations.includes(station.id);
  const nextStation = STATIONS.find((s) => s.id === station.id + 1);
  const tools = station.relatedToolSlugs.map(findTool).filter(Boolean);

  return (
    <main className="animate-fade-in">
      <PageHeader eyebrow={`תחנה ${station.id} מתוך 8`} title={station.title} description={station.subtitle} />

      <div className="px-5 space-y-5">
        <Card tone="highlight">
          <p className="text-xs text-clay-500 mb-2 font-medium">השאלה המרכזית</p>
          <p className="font-serif text-lg text-ink-700 leading-relaxed">{station.centralQuestion}</p>
          <p className="text-xs text-ink-400 mt-3">
            <strong>הסיכון בדילוג:</strong> {station.risk}
          </p>
        </Card>

        <Card>
          <p className="font-serif text-base text-ink-600 leading-relaxed italic mb-4">
            {station.chapterIntro}
          </p>
          <div className="text-ink-600 leading-relaxed space-y-3 whitespace-pre-wrap">
            {station.chapterContent}
          </div>
        </Card>

        <Card tone="warm">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="size-4 text-clay-400 shrink-0 mt-0.5" />
            <p className="text-xs text-clay-500 font-medium">התובנה המרכזית</p>
          </div>
          <p className="text-ink-700 leading-relaxed">{station.insight}</p>
        </Card>

        <div>
          <h3 className="font-medium text-ink-700 mb-3">שאלות למחשבה</h3>
          <div className="space-y-2">
            {station.reflectionQuestions.map((q, i) => (
              <Card key={i} tone="muted">
                <p className="text-ink-600 leading-relaxed">
                  <span className="text-clay-400 ml-2">{i + 1}.</span>
                  {q}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <Card tone="warm">
          <p className="text-xs text-clay-500 mb-2 font-medium">התרגיל לשבוע הקרוב</p>
          <p className="text-ink-700 leading-relaxed">{station.weeklyExercise}</p>
        </Card>

        {tools.length > 0 && (
          <div>
            <h3 className="font-medium text-ink-700 mb-3">כלים שמתאימים לתחנה הזאת</h3>
            <div className="space-y-2">
              {tools.map((t) =>
                t ? (
                  <Link key={t.slug} href={`/tools/${t.slug}`}>
                    <Card className="hover:bg-sand-100 transition-colors group cursor-pointer">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Wrench className="size-4 text-clay-400" />
                          <div>
                            <p className="font-medium text-ink-700">{t.title}</p>
                            <p className="text-xs text-ink-400">{t.tagline}</p>
                          </div>
                        </div>
                        <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500" />
                      </div>
                    </Card>
                  </Link>
                ) : null,
              )}
            </div>
          </div>
        )}

        <Quote source="סיכום פרק">{station.summary}</Quote>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => completeStation(station.id)}
            variant={isDone ? "outline" : "primary"}
            fullWidth
            size="lg"
          >
            {isDone ? (
              <>
                <Check className="size-4" />
                הושלם
              </>
            ) : (
              "סמן כהושלם"
            )}
          </Button>
        </div>

        {nextStation && (
          <Link href={`/learn/${nextStation.slug}`}>
            <Card className="hover:bg-sand-100 transition-colors group cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="size-4 text-clay-400" />
                  <div>
                    <p className="text-xs text-ink-400">התחנה הבאה</p>
                    <p className="font-medium text-ink-700">
                      {nextStation.id}. {nextStation.title}
                    </p>
                  </div>
                </div>
                <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500" />
              </div>
            </Card>
          </Link>
        )}
      </div>
    </main>
  );
}

function HealthyView() {
  return (
    <main className="animate-fade-in">
      <PageHeader
        eyebrow="נספח ז'"
        title="איך זה נראה כשזה בריא"
        description="לא איך שקרבה אמורה להיות באגדה. איך היא נראית ביום שלישי רגיל."
      />

      <div className="px-5 space-y-3 pb-8">
        {HEALTHY_PATTERNS.map((p, i) => (
          <Card key={i}>
            <p className="font-medium text-ink-700 mb-2">{p.title}</p>
            <p className="text-sm text-ink-500 leading-relaxed">{p.description}</p>
          </Card>
        ))}

        <Quote source="נספח ז'" className="pt-4">
          רוב הקשרים הבריאים אינם נראים מרשימים מבחוץ. הם פשוט מרגישים בטוחים מבפנים.
        </Quote>
      </div>
    </main>
  );
}
