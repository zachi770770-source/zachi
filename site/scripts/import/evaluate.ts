/**
 * הערכת איכות החיפוש וכיול סף ההתאמה מול הגרסה הפעילה בפועל.
 *
 * מריץ את 30 השאלות (questions.ts) דרך searchCompass ומדווח לכל שאלה:
 * מספר תוצאות, ציון עליון, מובאות קצרות (עד 160 תווים — ללא ציטוטים
 * ארוכים), מיקום (פרק/סעיף/עמודים), האם מספק והאם רועש. בנוסף מריץ שאילתות
 * off-topic ומחשב סף מומלץ מהתפלגות הציונים האמיתית (לא מהפיקסצ'ר 0.01).
 *
 * אינו כותב למסד ואינו משנה את search.ts — רק מודד וממליץ. ההחלטה על הסף
 * ועל הפעלת הגרסה נשארת ידנית (ה-orchestrator מפעיל רק אחרי שכל הבדיקות עברו).
 */
import type { Pool } from "pg";

import { searchCompass } from "@/lib/compass/search";
import { EVAL_QUESTIONS } from "./questions";

/** שאילתות שאמורות לא להחזיר דבר — בסיס לרצפת הרעש בכיול. */
const NEGATIVE_QUERIES = [
  "מתכון לעוגת שוקולד עם ריבת חלב",
  "תחזית מזג האוויר למחר בתל אביב",
  "איך מחליפים צמיג מנוקב באופניים",
  "מחירי מניות טכנולוגיה בבורסה",
  "חוקי הנבדל במשחק כדורגל",
];

const SNIPPET_MAX = 160;

function snippet(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= SNIPPET_MAX ? t : `${t.slice(0, SNIPPET_MAX)}…`;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

export interface ExcerptReport {
  chapterNumber: number;
  chapterName: string;
  sectionName: string | null;
  score: number;
  snippet: string;
}

export interface QuestionReport {
  id: number;
  theme: string;
  question: string;
  resultCount: number;
  topScore: number | null;
  excerpts: ExcerptReport[];
  /** האם האחזור מספק (יש תוצאה מעל הסף המומלץ). */
  sufficient: boolean;
  /** חשד לרעש: יש תוצאות אך הציון העליון נמוך מרצפת הרעש. */
  noise: boolean;
}

export interface CalibrationReport {
  positiveTop: { min: number; p25: number; median: number; max: number; count: number };
  negativeMax: number;
  /** סף מומלץ שמפריד בין הרעש (off-topic) לבין ההתאמות האמיתיות. */
  suggestedMinScore: number;
  /** האם FTS לבדו מפריד היטב (positives.p25 > negativeMax במרווח בטוח). */
  ftsSeparatesWell: boolean;
  note: string;
}

export interface EvalReport {
  questions: QuestionReport[];
  calibration: CalibrationReport;
  answeredCount: number;
  totalQuestions: number;
}

async function topScoreFor(pool: Pool, q: string, bookVersion?: string): Promise<number> {
  // minScore:0 כדי לצפות בציון הגולמי (כולל התאמות זעירות).
  const r = await searchCompass(pool, q, { minScore: 0, bookVersion });
  return r.results[0]?.score ?? 0;
}

/**
 * @param bookVersion אם ניתן — מעריך את הגרסה הזו ישירות (גם אם inactive),
 *   כדי לבדוק לפני הפעלה. אחרת מעריך את הגרסה הפעילה.
 */
export async function evaluateSearch(pool: Pool, bookVersion?: string): Promise<EvalReport> {
  // רעש: הציון העליון הגבוה ביותר מבין השאילתות ה-off-topic.
  const negScores: number[] = [];
  for (const nq of NEGATIVE_QUERIES) negScores.push(await topScoreFor(pool, nq, bookVersion));
  const negativeMax = negScores.length ? Math.max(...negScores) : 0;

  const positiveTops: number[] = [];
  const perQuestion: Array<{
    id: number;
    theme: string;
    question: string;
    resultCount: number;
    topScore: number | null;
    excerpts: ExcerptReport[];
  }> = [];

  for (const q of EVAL_QUESTIONS) {
    const r = await searchCompass(pool, q.text, { minScore: 0, bookVersion });
    const top = r.results[0]?.score ?? null;
    if (top !== null) positiveTops.push(top);
    perQuestion.push({
      id: q.id,
      theme: q.theme,
      question: q.text,
      resultCount: r.results.length,
      topScore: top,
      excerpts: r.results.map((m) => ({
        chapterNumber: m.chapterNumber,
        chapterName: m.chapterName,
        sectionName: m.sectionName,
        score: m.score,
        snippet: snippet(m.content),
      })),
    });
  }

  const sortedPos = [...positiveTops].sort((a, b) => a - b);
  const positiveTop = {
    min: sortedPos[0] ?? 0,
    p25: percentile(sortedPos, 25),
    median: percentile(sortedPos, 50),
    max: sortedPos[sortedPos.length - 1] ?? 0,
    count: sortedPos.length,
  };

  // סף מומלץ: מעל רצף הרעש, אך לא מעל רבעון-תחתון של ההתאמות האמיתיות.
  // מרווח בטוח קטן מעל הרעש; אם אין רעש כלל — רצפה נמוכה מ-p25.
  const margin = 0.005;
  const aboveNoise = negativeMax > 0 ? negativeMax + margin : Math.max(0.01, positiveTop.p25 * 0.5);
  const suggestedMinScore = Number(Math.min(aboveNoise, positiveTop.p25).toFixed(4)) || Number(aboveNoise.toFixed(4));
  const ftsSeparatesWell = positiveTop.p25 > negativeMax + margin;

  const note = ftsSeparatesWell
    ? "FTS מפריד היטב בין רעש להתאמות; הסף המומלץ בטוח."
    : "FTS אינו מפריד באופן ברור (p25 של ההתאמות אינו מעל רצפת הרעש) — שקלו אחזור היברידי או ניסוח שאלות/משקלים.";

  const calibration: CalibrationReport = {
    positiveTop,
    negativeMax: Number(negativeMax.toFixed(4)),
    suggestedMinScore,
    ftsSeparatesWell,
    note,
  };

  const questions: QuestionReport[] = perQuestion.map((p) => ({
    ...p,
    sufficient: p.topScore !== null && p.topScore >= suggestedMinScore,
    noise: p.resultCount > 0 && (p.topScore ?? 0) < suggestedMinScore,
  }));

  return {
    questions,
    calibration,
    answeredCount: questions.filter((q) => q.sufficient).length,
    totalQuestions: questions.length,
  };
}
