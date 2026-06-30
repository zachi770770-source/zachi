"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Quote } from "@/components/ui/Quote";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { VOICES, VOICE_KEYS } from "@/content/voices";
import { findTool } from "@/content/tools";
import { STATIONS } from "@/content/stations";

export default function DiagnosisResultPage() {
  const router = useRouter();
  const { latestDiagnosis } = useAppStore();
  const result = latestDiagnosis();

  if (!result) {
    if (typeof window !== "undefined") router.push("/diagnosis");
    return null;
  }

  const sortedVoices = VOICE_KEYS
    .map((k) => ({ key: k, score: result.scores[k], meta: VOICES[k] }))
    .sort((a, b) => b.score - a.score);

  const dominant = VOICES[result.dominantVoice];
  const station = STATIONS.find((s) => s.id === result.recommendedStationId);
  const tools = result.recommendedToolSlugs.map(findTool).filter(Boolean);

  return (
    <main className="animate-fade-in">
      <PageHeader eyebrow="התוצאה שלך" title="מי אוחז אצלך בהגה" showBack={false} />

      <div className="px-5 space-y-5">
        <Card tone="highlight">
          <p className="text-xs text-clay-500 mb-2 font-medium">הקול הדומיננטי כרגע</p>
          <h2 className="font-serif text-2xl text-ink-700 mb-3">{dominant.name}</h2>
          <p className="text-ink-500 leading-relaxed">{dominant.description}</p>
        </Card>

        <div>
          <h3 className="font-medium text-ink-700 mb-3">חמשת הקולות שלך</h3>
          <div className="space-y-2.5">
            {sortedVoices.map((v) => {
              const pct = (v.score / 5) * 100;
              const isDom = v.key === result.dominantVoice;
              return (
                <div key={v.key} className="bg-white rounded-xl p-4 border border-sand-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDom ? "text-clay-500" : "text-ink-600"}`}>
                      {v.meta.name}
                    </span>
                    <span className="text-xs text-ink-400">{v.score.toFixed(1)}/5</span>
                  </div>
                  <div className="h-1.5 bg-sand-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${isDom ? "bg-clay-400" : "bg-sand-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Card tone="warm">
          <p className="text-xs text-ink-400 mb-2 font-medium">מה הקול הזה נתן לך פעם</p>
          <p className="text-ink-600 text-sm leading-relaxed mb-4">{dominant.whatItGave}</p>
          <p className="text-xs text-ink-400 mb-2 font-medium">מה הוא גובה ממך היום</p>
          <p className="text-ink-600 text-sm leading-relaxed">{dominant.whatItCosts}</p>
        </Card>

        <div>
          <h3 className="font-medium text-ink-700 mb-3">3 צעדים קטנים לשבוע הקרוב</h3>
          <Card>
            <ol className="space-y-3 text-ink-600 text-sm leading-relaxed list-decimal pr-4">
              <li>
                בפעם הבאה שהקול הזה עולה — תן לו שם בתוך עצמך, גם אם רק אחרי שכבר פעל. גם זה נחשב.
              </li>
              <li>
                תרגל את הכלי <strong>{tools[0]?.title ?? "מי אוחז בהגה"}</strong> פעם אחת השבוע.
              </li>
              <li>
                קרא את פרק <strong>{station?.title}</strong> באזור הלמידה.
              </li>
            </ol>
          </Card>
        </div>

        {tools.length > 0 && (
          <div>
            <h3 className="font-medium text-ink-700 mb-3">כלים מתאימים לך</h3>
            <div className="space-y-2">
              {tools.map((t) =>
                t ? (
                  <Link key={t.slug} href={`/tools/${t.slug}`}>
                    <Card className="hover:bg-sand-100 transition-colors group cursor-pointer">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-ink-700">{t.title}</p>
                          <p className="text-xs text-ink-400 mt-1">{t.tagline}</p>
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

        {station && (
          <Link href={`/learn/${station.slug}`}>
            <Card tone="warm" className="hover:bg-sand-200 transition-colors group cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-ink-400 mb-1">המסלול המומלץ להתחיל ממנו</p>
                  <p className="font-serif text-lg text-ink-700">
                    תחנה {station.id}: {station.title}
                  </p>
                </div>
                <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500" />
              </div>
            </Card>
          </Link>
        )}

        <Quote source="נספח ג'">
          זה אינו מבחן ולא ציון על מי שאתם. זו דרך פשוטה לראות איזה קול מוביל אתכם עכשיו.
        </Quote>

        <div className="flex gap-3 pt-4">
          <Link href="/" className="flex-1">
            <Button variant="outline" fullWidth>
              למסך הבית
            </Button>
          </Link>
          <Link href="/coach" className="flex-1">
            <Button fullWidth>
              לשוחח עם המאמן
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
