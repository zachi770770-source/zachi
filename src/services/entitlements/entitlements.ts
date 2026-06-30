import type { Feature, Plan } from "@/types";

// Phase 1: כל המשתמשים פתוחים. הפונקציה קיימת כדי שב־Phase 2 נצטרך לשנות רק כאן.
export function getCurrentPlan(): Plan {
  return "free";
}

export function hasFeature(_feature: Feature): boolean {
  // ב־MVP: כל הפיצ'רים פתוחים, גם אלה שסומנו כ־premium ב־CMS.
  return true;
}

export function isPremium(): boolean {
  return getCurrentPlan() === "premium";
}
