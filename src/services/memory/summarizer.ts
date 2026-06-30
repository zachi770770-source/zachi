/**
 * summarizer — מסכם שיחות ארוכות לסיכום של 1-3 משפטים שיכנס ל-MemoryCard.
 *
 * רץ בצד שרת (אופציונלי, כשיש Claude API key).
 * אם אין — מחזיר תמצית מבוססת מילים ראשונות.
 */

import type { CoachMessage } from "@/types/ai";

const SUMMARIZER_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

const SUMMARIZER_SYSTEM = `אתה בונה זיכרון לטווח ארוך עבור "המאמן" — מאמן זוגיות מבוסס ספר.
התפקיד שלך: לסכם שיחה אחת במשפט אחד עד שניים, בעברית, גוף שלישי, בלי לצטט.

הסיכום חייב להכיל:
- מה הסיטואציה ששותפה (במילה אחת או שתיים).
- איזה דפוס או קול עלה.
- מה הכלי שהוצע (אם הוצע).

דוגמה: "המשתמש דיווח על דייט חדש, עלה הצורך באישור, הוצע משולש העובדה."

אסור: ציטוטים מילוליים, פרטים אישיים מזהים, אבחנות.

ענה רק במשפט הסיכום, בלי הקדמות.`;

export async function summarizeConversation(
  messages: CoachMessage[],
): Promise<string> {
  const text = messages
    .map((m) => `${m.role === "user" ? "משתמש" : "מאמן"}: ${m.content}`)
    .join("\n");

  const trimmed = text.slice(0, 2500);

  // אם אין מפתח Anthropic — fallback בסיסי
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return naiveSummary(messages);
  }

  try {
    // ייבוא דינמי כדי לא לטעון אנתרופיק ב-cold paths
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: SUMMARIZER_MODEL,
      max_tokens: 150,
      system: SUMMARIZER_SYSTEM,
      messages: [{ role: "user", content: trimmed }],
    });
    const out = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return out || naiveSummary(messages);
  } catch {
    return naiveSummary(messages);
  }
}

function naiveSummary(messages: CoachMessage[]): string {
  const userMsgs = messages.filter((m) => m.role === "user");
  const lastUser = userMsgs[userMsgs.length - 1];
  const intent = lastUser?.intent ?? "situation";
  const intentLabel: Record<string, string> = {
    situation: "סיטואציה",
    date: "דייט",
    journal: "יומן",
    plan: "תוכנית שבועית",
    conversation: "ניסוח שיחה",
  };
  return `שיחה בנושא ${intentLabel[intent] ?? intent}. ${userMsgs.length} הודעות.`;
}
