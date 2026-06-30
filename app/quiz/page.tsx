"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { QUESTIONS, PROFILES, scoreQuiz, type ProfileKey } from "@/lib/quiz";

type View = "intro" | "questions" | "results";

export default function QuizPage() {
  const [view, setView] = useState<View>("intro");
  const [answers, setAnswers] = useState<Array<number | null>>(
    () => Array(QUESTIONS.length).fill(null)
  );
  const [current, setCurrent] = useState(0);

  const total = QUESTIONS.length;
  const answeredCount = answers.filter((a) => a !== null).length;
  const progress = Math.round((answeredCount / total) * 100);

  const result = useMemo(() => {
    if (view !== "results") return null;
    return scoreQuiz(answers);
  }, [view, answers]);

  function selectOption(idx: number) {
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
    setTimeout(() => {
      if (current < total - 1) {
        setCurrent(current + 1);
      } else {
        setView("results");
      }
    }, 180);
  }

  function restart() {
    setAnswers(Array(QUESTIONS.length).fill(null));
    setCurrent(0);
    setView("intro");
  }

  if (view === "intro") {
    return (
      <section className="container-prose pt-14 sm:pt-20 pb-20 text-right">
        <span className="eyebrow">אבחון אישי</span>
        <h1 className="section-heading mt-3">12 שאלות שיגידו לך איפה את/ה היום</h1>
        <p className="mt-5 text-lg text-ink-700 leading-relaxed">
          האבחון לא נועד לתייג אותך — אלא להאיר. אין תשובות נכונות, יש רק תשובות כנות.
          ההמלצה: ענה/י מהבטן, לא ממה שהיית רוצה להיות נכון. בסוף תקבל/י ציון מוכנות,
          פרופיל מרכזי, ושלוש פעולות מעשיות.
        </p>
        <ul className="mt-8 grid gap-3 text-ink-700">
          <li className="flex items-start gap-3"><Dot /> 12 שאלות · כ־3 דקות</li>
          <li className="flex items-start gap-3"><Dot /> ללא הרשמה · ללא שמירת מידע</li>
          <li className="flex items-start gap-3"><Dot /> תוצאות מעשיות עם המלצה לכלי הבא</li>
        </ul>
        <button onClick={() => setView("questions")} className="btn-primary mt-10">
          להתחיל
        </button>
      </section>
    );
  }

  if (view === "questions") {
    const q = QUESTIONS[current];
    return (
      <section className="container-prose pt-10 sm:pt-14 pb-20 text-right">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-ink-500">שאלה {current + 1} מתוך {total}</span>
          <span className="text-sm text-ink-500">{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-cream-300/70 overflow-hidden">
          <div
            className="h-full bg-burgundy-600 transition-all duration-300"
            style={{ width: `${((current + (answers[current] !== null ? 1 : 0)) / total) * 100}%` }}
          />
        </div>

        <h2 className="font-display text-2xl sm:text-3xl text-ink-900 leading-snug mt-8">
          {q.prompt}
        </h2>

        <div className="mt-7 grid gap-3">
          {q.options.map((opt, idx) => {
            const selected = answers[current] === idx;
            return (
              <button
                key={idx}
                onClick={() => selectOption(idx)}
                className={
                  "w-full text-right rounded-xl border px-5 py-4 leading-relaxed transition-all " +
                  (selected
                    ? "border-burgundy-600 bg-burgundy-600/5 text-ink-900 shadow-card"
                    : "border-cream-300 bg-cream-50 hover:border-burgundy-600/50 hover:bg-cream-50 text-ink-800")
                }
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            className="text-sm text-ink-500 hover:text-burgundy-700 disabled:opacity-40 disabled:hover:text-ink-500"
          >
            ← קודם
          </button>
          {current < total - 1 ? (
            <button
              onClick={() => setCurrent(current + 1)}
              disabled={answers[current] === null}
              className="text-sm text-burgundy-700 hover:text-burgundy-800 disabled:opacity-40"
            >
              דלג קדימה →
            </button>
          ) : (
            <button
              onClick={() => setView("results")}
              disabled={answers[current] === null}
              className="text-sm text-burgundy-700 hover:text-burgundy-800 disabled:opacity-40"
            >
              לסיים →
            </button>
          )}
        </div>
      </section>
    );
  }

  // results
  if (!result) return null;
  const profile = PROFILES[result.profile];

  return (
    <section className="container-prose pt-14 sm:pt-20 pb-20 text-right">
      <span className="eyebrow">תוצאה אישית</span>
      <h1 className="section-heading mt-3">הקריאה שלך</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <div className="text-sm text-ink-500">ציון מוכנות</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-5xl font-semibold text-burgundy-700">
              {result.readiness}
            </span>
            <span className="text-ink-500">/ 100</span>
          </div>
          <p className="mt-3 text-sm text-ink-700 leading-relaxed">
            {readinessText(result.readiness)}
          </p>
        </div>
        <div className="card">
          <div className="text-sm text-ink-500">פרופיל מרכזי</div>
          <div className="mt-3 font-display text-2xl text-ink-900">{profile.title}</div>
          <ProfileBars scores={result.scores} top={result.profile} />
        </div>
      </div>

      <div className="card mt-5">
        <h3 className="font-display text-xl text-burgundy-700">מה זה אומר עליך</h3>
        <p className="mt-3 text-ink-800 leading-relaxed">{profile.summary}</p>
      </div>

      <div className="card mt-5">
        <h3 className="font-display text-xl text-burgundy-700">שלוש פעולות מעשיות</h3>
        <ol className="mt-4 grid gap-3">
          {profile.recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-3 text-ink-800 leading-relaxed">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-burgundy-600 text-cream-50 text-xs font-semibold">
                {i + 1}
              </span>
              {r}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-5 rounded-2xl bg-burgundy-700 text-cream-50 p-7 shadow-card">
        <div className="text-cream-200/80 text-sm">הכלי הבא שיתאים לך</div>
        <div className="mt-2 font-display text-2xl">{profile.nextTool.name}</div>
        <p className="mt-2 text-cream-100/90 leading-relaxed">{profile.nextTool.reason}</p>
        <Link href="/tools" className="inline-flex mt-5 items-center gap-1 text-cream-50 underline underline-offset-4 decoration-cream-200/60 hover:decoration-cream-50">
          לעבור לכלים →
        </Link>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button onClick={restart} className="btn-secondary">לעשות שוב</button>
        <Link href="/method" className="btn-primary">לקרוא על השיטה</Link>
      </div>
    </section>
  );
}

function Dot() {
  return <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-burgundy-600 shrink-0" />;
}

function readinessText(score: number) {
  if (score >= 75) return "את/ה במצב טוב לבנייה. שמור/י על המבנה הפנימי הזה.";
  if (score >= 55) return "בסיס בריא קיים — צריך לחדד דפוסים ספציפיים כדי לעבור לבנייה.";
  if (score >= 35) return "כדאי להאט קצב ולעבוד על שני־שלושה דברים בסיסיים לפני קשר חדש.";
  return "המקום הזה דורש עבודה ראשונית עם עצמך לפני שמכניסים בן/בת זוג למשוואה.";
}

function ProfileBars({ scores, top }: { scores: Record<ProfileKey, number>; top: ProfileKey }) {
  const max = Math.max(...Object.values(scores), 1);
  const keys: ProfileKey[] = ["seeker", "runner", "avoider", "builder"];
  return (
    <div className="mt-4 space-y-2">
      {keys.map((k) => {
        const v = scores[k];
        const pct = Math.round((v / max) * 100);
        const isTop = k === top;
        return (
          <div key={k}>
            <div className="flex justify-between text-xs text-ink-500 mb-1">
              <span className={isTop ? "text-burgundy-700 font-medium" : ""}>{PROFILES[k].shortLabel}</span>
              <span>{v}</span>
            </div>
            <div className="h-1.5 rounded-full bg-cream-300/70 overflow-hidden">
              <div
                className={"h-full " + (isTop ? "bg-burgundy-600" : "bg-ink-400/60")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
