"use client";

import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Quote } from "@/components/ui/Quote";
import { STATIONS } from "@/content/stations";
import { useAppStore } from "@/store/useAppStore";

export default function LearnIndexPage() {
  const { completedStations } = useAppStore();

  return (
    <main className="animate-fade-in">
      <PageHeader
        eyebrow="המסע"
        title="שמונה תחנות"
        description="מסע מחיפוש לבנייה. כל תחנה: שיעור קצר, תובנה אחת, ותרגיל שבועי."
        showBack={false}
      />

      <div className="px-5 space-y-3 pb-8">
        {STATIONS.map((s) => {
          const isDone = completedStations.includes(s.id);
          return (
            <Link key={s.id} href={`/learn/${s.slug}`}>
              <Card className="hover:bg-sand-100 transition-colors group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 size-10 rounded-full grid place-items-center font-medium text-sm ${
                      isDone
                        ? "bg-sage-200 text-sage-500"
                        : "bg-sand-200 text-ink-500"
                    }`}
                  >
                    {isDone ? <Check className="size-4" /> : s.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg text-ink-700">{s.title}</p>
                    <p className="text-xs text-clay-400 mb-2">{s.subtitle}</p>
                    <p className="text-sm text-ink-500 leading-relaxed">{s.summary}</p>
                  </div>
                  <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500 shrink-0 mt-2" />
                </div>
              </Card>
            </Link>
          );
        })}

        <div className="pt-6">
          <Link href="/learn/healthy">
            <Card tone="warm" className="hover:bg-sand-200 transition-colors group cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-ink-400 mb-1">נספח ז'</p>
                  <p className="font-serif text-lg text-ink-700">איך זה נראה כשזה בריא</p>
                </div>
                <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500" />
              </div>
            </Card>
          </Link>
        </div>

        <Quote source="מבוא" className="pt-6">
          הספר הזה לא מבטיח שמישהו יגיע; אף ספר לא יכול. מה שאני כן יכול לתת זה הבנה של מה קורה בתוככם — ושליטה קטנה אך אמיתית על מה שתעשו בו.
        </Quote>
      </div>
    </main>
  );
}
