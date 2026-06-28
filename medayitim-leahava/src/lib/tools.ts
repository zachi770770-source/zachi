import type { ToolSlug } from "./types";

export interface ToolMeta {
  slug: ToolSlug;
  title: string;
  purpose: string;
  href: string;
}

/**
 * Central registry of all reflection tools.
 * Used by the tools library, dashboard quick access and the journal labels.
 */
export const TOOLS: ToolMeta[] = [
  {
    slug: "fact-story-action",
    title: "עובדה·סיפור·פעולה",
    purpose: "להפריד בין מה שקרה, מה שסיפרנו לעצמנו, ומה נכון לעשות עכשיו.",
    href: "/tools/fact-story-action",
  },
  {
    slug: "three-gates",
    title: "מבחן שלושת השערים",
    purpose: "לבדוק אם יש קרקע יציבה שאפשר לבנות עליה קשר, מעבר למשיכה.",
    href: "/tools/three-gates",
  },
  {
    slug: "safe-silence",
    title: "שקט בטוח מול שקט מת",
    purpose: "להבחין בין שקט שמרגיע ומחבר לבין שקט שמרחיק ומוחק.",
    href: "/tools/safe-silence",
  },
  {
    slug: "maintenance-20",
    title: "תחזוקת ה־20",
    purpose: "תחזוקה שבועית קטנה שמחזיקה קשר קיים חי ובריא.",
    href: "/tools/maintenance-20",
  },
  {
    slug: "72-hours",
    title: "נוהל 72 שעות",
    purpose: "מסגרת רגועה לתיקון ולחזרה לשיחה אחרי ריב.",
    href: "/tools/72-hours",
  },
];

export const TOOL_BY_SLUG: Record<string, ToolMeta> = Object.fromEntries(
  TOOLS.map((t) => [t.slug, t]),
);

/** Human-readable Hebrew title for a stored tool slug. */
export function toolTitle(slug: string): string {
  return TOOL_BY_SLUG[slug]?.title ?? slug;
}

/** Shared safety note shown in conflict-related tools. */
export const SAFETY_NOTE =
  "במצבים של אלימות, פחד, שליטה, השפלה או סכנה — יש לפנות לעזרה מקצועית ולא להשתמש באפליקציה כתחליף.";
