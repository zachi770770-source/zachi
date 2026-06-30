"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Quote } from "@/components/ui/Quote";
import { useAppStore } from "@/store/useAppStore";
import { SEGMENT_OPTIONS } from "@/content/questions";
import type { UserSegment } from "@/types";

type Step = "welcome" | "segment" | "privacy";

export default function OnboardingPage() {
  const router = useRouter();
  const { setSegment, setOnboarded, setAnalyticsConsent } = useAppStore();
  const [step, setStep] = useState<Step>("welcome");
  const [selected, setSelected] = useState<UserSegment | null>(null);

  const handleFinish = (consent: boolean) => {
    if (!selected) return;
    setSegment(selected);
    setAnalyticsConsent(consent);
    setOnboarded(true);
    router.push("/");
  };

  if (step === "welcome") {
    return (
      <main className="px-5 pt-16 animate-fade-in">
        <p className="text-xs uppercase tracking-widest text-clay-400 font-medium mb-4">
          מדייטים לאהבה
        </p>
        <h1 className="font-serif text-4xl text-ink-700 leading-tight">
          אהבה לא מוצאים.
          <br />
          <span className="text-clay-400">בונים.</span>
        </h1>
        <div className="my-8 space-y-4 text-ink-500 leading-relaxed">
          <p>
            האפליקציה הזאת מבוססת אך ורק על הספר של צחי חן.
            אין כאן ייעוץ זוגי כללי, ואין כאן ידע חיצוני.
            רק הספר — והוא הופך לכלים שאפשר להשתמש בהם בזמן אמת.
          </p>
          <p className="text-ink-400 text-sm">
            לפני שמתחילים — שאלה אחת קצרה כדי שנדע איפה לפגוש אותך.
          </p>
        </div>
        <Button onClick={() => setStep("segment")} fullWidth size="lg">
          להתחיל
          <ArrowLeft className="size-5" />
        </Button>
      </main>
    );
  }

  if (step === "segment") {
    return (
      <main className="px-5 pt-12 animate-fade-in">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-clay-400 font-medium mb-2">
            איפה אתה היום
          </p>
          <h1 className="font-serif text-2xl text-ink-700 leading-tight">
            הספר מסלולי. בחר את המקום שאתה הכי קרוב אליו עכשיו.
          </h1>
        </header>

        <div className="space-y-3">
          {SEGMENT_OPTIONS.map((opt) => {
            const isActive = selected === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSelected(opt.key)}
                className={`w-full text-right rounded-2xl border-2 p-5 transition-colors ${
                  isActive
                    ? "border-ink-700 bg-ink-700 text-sand-50"
                    : "border-sand-200 bg-white hover:border-ink-300"
                }`}
              >
                <p className={`font-medium mb-1 ${isActive ? "text-sand-50" : "text-ink-700"}`}>
                  {opt.title}
                </p>
                <p className={`text-sm leading-relaxed ${isActive ? "text-sand-200" : "text-ink-400"}`}>
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>

        <Button
          onClick={() => setStep("privacy")}
          disabled={!selected}
          fullWidth
          size="lg"
          className="mt-8"
        >
          המשך
          <ArrowLeft className="size-5" />
        </Button>
      </main>
    );
  }

  return (
    <main className="px-5 pt-12 animate-fade-in">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-clay-400 font-medium mb-2">
          פרטיות
        </p>
        <h1 className="font-serif text-2xl text-ink-700 leading-tight">
          ההתקדמות שלך נשמרת על המכשיר שלך בלבד.
        </h1>
      </header>

      <Card tone="muted" className="space-y-3 text-sm text-ink-500 leading-relaxed">
        <p>• כל מה שאתה ממלא נשמר במכשיר שלך (localStorage). אין שרת שמכיר אותך.</p>
        <p>• בעתיד, אם תרצה זיכרון לאורך זמן מכמה מכשירים — נציע הרשמה אופציונלית.</p>
        <p>• אם תאשר אנליטיקה אנונימית, נדע איזה כלים עוזרים יותר — בלי לדעת מי אתה.</p>
        <p>• בכל עת, מ"התקדמות" → "פרטיות", תוכל למחוק הכול.</p>
      </Card>

      <div className="mt-8 space-y-3">
        <Button onClick={() => handleFinish(true)} fullWidth size="lg">
          מאשר אנליטיקה אנונימית
        </Button>
        <Button onClick={() => handleFinish(false)} variant="outline" fullWidth size="lg">
          המשך בלי אנליטיקה
        </Button>
      </div>

      <Quote source="פרק 1" className="mt-10">
        מוכנות אינה שלמות. היא היכולת לזהות מי עומד לדבר במקומך.
      </Quote>
    </main>
  );
}
