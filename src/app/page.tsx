"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Compass, MessageCircle, BookOpen, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Quote } from "@/components/ui/Quote";
import { useAppStore } from "@/store/useAppStore";
import { VOICES } from "@/content/voices";

export default function HomePage() {
  const router = useRouter();
  const { hasOnboarded, latestDiagnosis } = useAppStore();
  const latest = latestDiagnosis();

  useEffect(() => {
    if (!hasOnboarded) router.push("/onboarding");
  }, [hasOnboarded, router]);

  if (!hasOnboarded) return null;

  return (
    <main className="px-5 pt-12 animate-fade-in">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-clay-400 font-medium mb-3">
          מדייטים לאהבה
        </p>
        <h1 className="font-serif text-4xl text-ink-700 leading-tight">
          אהבה לא מוצאים.
          <br />
          <span className="text-clay-400">בונים.</span>
        </h1>
        <p className="mt-4 text-ink-500 leading-relaxed">
          מי אוחז אצלך בהגה כשאהבה מתקרבת?
          <br />
          האפליקציה מבוססת על הספר של צחי חן.
        </p>
      </header>

      {latest && (
        <Card tone="highlight" className="mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="size-5 text-clay-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-ink-400 mb-1">לפי האבחון האחרון שלך</p>
              <p className="text-sm text-ink-700 leading-relaxed">
                הקול הדומיננטי: <strong>{VOICES[latest.dominantVoice].name}</strong>.
                בואו נמשיך לעבוד עליו.
              </p>
            </div>
          </div>
        </Card>
      )}

      <section className="space-y-3 mb-10">
        <Link href="/diagnosis">
          <Card className="hover:bg-sand-100 transition-colors group cursor-pointer">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-ink-700 text-sand-50 grid place-items-center">
                  <Compass className="size-5" />
                </div>
                <div>
                  <p className="font-medium text-ink-700">
                    {latest ? "לעשות אבחון מחדש" : "התחל אבחון אישי"}
                  </p>
                  <p className="text-xs text-ink-400">12 שאלות. 3 דקות.</p>
                </div>
              </div>
              <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link href="/tools">
          <Card className="hover:bg-sand-100 transition-colors group cursor-pointer">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-sand-200 text-ink-700 grid place-items-center">
                  <Wrench className="size-5" />
                </div>
                <div>
                  <p className="font-medium text-ink-700">הכלים</p>
                  <p className="text-xs text-ink-400">15 כלים אינטראקטיביים מהספר</p>
                </div>
              </div>
              <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link href="/coach">
          <Card className="hover:bg-sand-100 transition-colors group cursor-pointer">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-clay-100 text-clay-500 grid place-items-center">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <p className="font-medium text-ink-700">המאמן</p>
                  <p className="text-xs text-ink-400">שיחה מבוססת ספר בלבד</p>
                </div>
              </div>
              <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link href="/learn">
          <Card className="hover:bg-sand-100 transition-colors group cursor-pointer">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-sage-100 text-sage-500 grid place-items-center">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <p className="font-medium text-ink-700">אזור הלמידה</p>
                  <p className="text-xs text-ink-400">שמונה תחנות המסע</p>
                </div>
              </div>
              <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500 transition-colors" />
            </div>
          </Card>
        </Link>
      </section>

      <Quote source="פרק 1">
        מוכנות אינה אומרת שלא תפחדו. היא אומרת שלא תתנו לפחד לבחור במקומכם.
      </Quote>

      <div className="mt-10 mb-6">
        <Link href="/about">
          <Button variant="ghost" size="sm">
            על השיטה ←
          </Button>
        </Link>
      </div>
    </main>
  );
}
