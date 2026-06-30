import type { IAIProvider, ChatInput } from "../IAIProvider";
import type { CoachResponse } from "@/types/ai";
import { VOICES } from "@/content/voices";
import { TOOLS } from "@/content/tools";

// MockProvider — תשובות מבוססות־ספר ל־MVP.
// ב־Phase 2 יוחלף ב־ClaudeProvider עם RAG אמיתי.
// העיקרון: כל תשובה במבנה 4-חלקים מהספר (עובדה / סיפור / פעולה / כלי).

const SAFETY_KEYWORDS = [
  "אלימות",
  "מכה",
  "הכה",
  "מכות",
  "מאיים",
  "איום",
  "שולט",
  "שליטה",
  "כפייה",
  "בידוד",
  "השפלה",
  "מעקב",
  "פגיעה עצמית",
  "להתאבד",
  "אתאבד",
];

function detectSafety(text: string): boolean {
  const lower = text.toLowerCase();
  return SAFETY_KEYWORDS.some((kw) => lower.includes(kw));
}

// פאטרן זיהוי דפוסים — מהספר
function detectPatternHints(text: string): string[] {
  const lower = text.toLowerCase();
  const hints: string[] = [];
  if (/(לא ענה|לא עונה|לא ענתה|נקרא|שלח|הודעה|בודק|דחיפ)/.test(lower)) {
    hints.push("approval");
  }
  if (/(לברוח|פגם|סגרתי|חניק|אוויר|מרחב|התרחק)/.test(lower)) {
    hints.push("avoidance");
  }
  if (/(אמרתי שזה בסדר|בלעתי|לא רציתי לעשות עניין|רציתי לרצות|נחמ)/.test(lower)) {
    hints.push("pleasing");
  }
  if (/(הצל|לעזור לו|זקוק לי|לתקן|לתמוך)/.test(lower)) {
    hints.push("rescuer");
  }
  if (/(אין לי איך|לא יכול בלי|חייב לדעת|חייב לחזור|עוד הודעה)/.test(lower)) {
    hints.push("clinging");
  }
  return hints;
}

function pickToolForIntent(intent: string, hints: string[]): string {
  // לוגיקת בחירת כלי לפי הקשר
  if (hints.includes("approval") || hints.includes("clinging")) return "fact-triangle";
  if (hints.includes("avoidance")) return "spark-test";
  if (hints.includes("pleasing")) return "soft-start";
  if (hints.includes("rescuer")) return "excuses-ladder";
  if (intent === "date") return "spark-test";
  if (intent === "conversation") return "soft-start";
  if (intent === "journal") return "whos-driving";
  if (intent === "plan") return "fact-triangle";
  return "whos-driving";
}

function dominantVoiceText(memoryDominant?: string): string {
  if (!memoryDominant) return "";
  const v = (VOICES as Record<string, typeof VOICES.approval | undefined>)[memoryDominant];
  if (!v) return "";
  return `מהאבחון האחרון שלך זיהינו את ${v.name} כקול הדומיננטי. ייתכן שגם כאן הוא משחק תפקיד.`;
}

export class MockProvider implements IAIProvider {
  name = "mock" as const;

  async chat(input: ChatInput): Promise<CoachResponse> {
    // השהיה קלה להרגשת "חשיבה"
    await new Promise((r) => setTimeout(r, 700));

    const { intent, userText, memory } = input;

    if (detectSafety(userText)) {
      return {
        facts:
          "מה שתיארת נשמע מעבר לכלים של האפליקציה. אני חייב לעצור כאן לרגע.",
        story:
          "האפליקציה הזאת אינה תחליף לעזרה מקצועית או לעזרה בטיחותית. אם יש איום, אלימות, שליטה או כפייה — אתה לא חייב להתמודד עם זה לבד.",
        nextAction:
          "פנה עכשיו לאדם בטוח, לקופת חולים, לשירותי הרווחה, או למרכז סיוע מוכר. עברו למסך הבטיחות באפליקציה.",
        toolSuggestion: undefined,
        safetyTriggered: true,
      };
    }

    const hints = detectPatternHints(userText);
    const toolSlug = pickToolForIntent(intent, hints);
    const tool = TOOLS.find((t) => t.slug === toolSlug);

    const memoryNote = dominantVoiceText(memory?.dominantVoice);

    const responses: Record<string, CoachResponse> = {
      situation: {
        facts: `העובדה: ${userText.slice(0, 120)}${userText.length > 120 ? "…" : ""}.\n${memoryNote}`,
        story:
          hints.includes("approval")
            ? "ייתכן שהראש שלך כותב סיפור על השתיקה לפני שיש לך עובדה אחת. כשהדחף לבדוק עולה, אתה כבר לא בודק הודעה — אתה בודק אם אתה חשוב למישהו."
            : hints.includes("avoidance")
              ? "ייתכן שדווקא כשמשהו נעשה אמיתי, החלק שלמד שקרבה מסוכנת מתעורר. הוא יציע פגם, יציע עומס, יציע דרך חוצה."
              : hints.includes("pleasing")
                ? "ייתכן שהקול שאמר 'תהיה נוח, אל תעשה עניין' מנסה לבחור עכשיו במקומך. השאלה אינה אם זה 'בסדר' — אלא מה אתה באמת צריך."
                : "ייתכן שמתחת לעובדה אתה מסביר משהו — את עצמך, את הצד השני, את הנסיבות. שווה לעצור ולשאול: מה הסיפור שאני מוסיף?",
        nextAction:
          "אל תכריע בתוך הסערה. החזר את הגוף לחדר — נשימה אחת איטית, כפות רגליים על הרצפה. רק אחר כך תחליט. הפעולה הבריאה היא לרוב לעצור, לא לפעול.",
        toolSuggestion: tool
          ? { slug: tool.slug, reason: `הכלי "${tool.title}" עוזר בדיוק בסיטואציה הזאת.` }
          : undefined,
      },
      date: {
        facts: `העובדות מהדייט: ${userText.slice(0, 120)}${userText.length > 120 ? "…" : ""}.`,
        story:
          "השאלה אחרי דייט אינה 'האם הוא אהב אותי?' (אודישן) ולא 'האם הוא עבר את הבדיקה?' (ראיון). השאלה היחידה שמחזירה אותך לחדר היא: 'האם אני רוצה לראות אותו שוב?'",
        nextAction:
          "בדוק את הגוף בשעות אחרי — נרגעת או נדרכת? אם נדרכת, ייתכן שהיה ניצוץ חרדתי. אם נרגעת, ייתכן שהיה ניצוץ בריא. ואם אין כלום, תן לעצמך עוד מפגש או שניים לפני שאתה פוסל.",
        toolSuggestion: tool
          ? { slug: tool.slug, reason: `"${tool.title}" יעזור לך לבדוק את זה ביושר.` }
          : undefined,
      },
      journal: {
        facts: `שמעתי מה שתיארת. ${memoryNote}`,
        story: hints.length
          ? `נראה שאולי עולה כאן דפוס של ${hints.map((h) => (VOICES as Record<string, typeof VOICES.approval | undefined>)[h]?.shortName).filter(Boolean).join(", ")}. אני לא קובע — רק משקף בעדינות.`
          : "לפעמים מה שעולה ביומן הוא חומר גלם — לא תובנה מיידית. תן לזה לבעבע מעט.",
        nextAction:
          "אל תהפוך את היומן לעוד דרישה. שב/י איתו פעם בשבוע. ראה אילו מילים חוזרות. הדפוסים נחשפים בחזרתיות, לא בערב אחד.",
        toolSuggestion: tool
          ? { slug: tool.slug, reason: "כלי תרגול שיעזור לעבד את מה שעלה." }
          : undefined,
      },
      plan: {
        facts: `על בסיס מה שתיארת${memory?.dominantVoice ? ` והקול הדומיננטי שלך (${(VOICES as Record<string, typeof VOICES.approval | undefined>)[memory.dominantVoice]?.name})` : ""}:`,
        story:
          "תוכנית טובה אינה רשימה של 10 שינויים. היא דבר אחד קטן שאני עושה אחרת השבוע, ושאני יכול לסיים בבוקר ולהתחיל בערב הבא.",
        nextAction:
          "בחר/י דבר אחד לשבוע. לא הכול. אחד. נסה/י: בפעם הבאה שתרגיש את הקול הישן עולה — תן/י לו שם בקול. גם אם רק בתוך עצמך. גם אחרי שהוא כבר פעל.",
        toolSuggestion: tool
          ? { slug: tool.slug, reason: `${tool.title} הוא המקום להתחיל ממנו.` }
          : undefined,
      },
      conversation: {
        facts: `הסיטואציה: ${userText.slice(0, 120)}${userText.length > 120 ? "…" : ""}.`,
        story:
          "תלונה היא צורך שיצא בלבוש של התקפה. לפני שאתה פותח את הפה — תרגם אותה בחזרה לבקשה.",
        nextAction:
          "נסה ההתחלה הרכה: רגש אחד ('הרגשתי לבד'), התנהגות אחת ('כשענית אחרי שש שעות'), בקשה אחת ('בא לי לדעת מתי לחזור'). בלי 'אתה תמיד'. בלי 'את אף פעם'.",
        toolSuggestion: tool
          ? { slug: tool.slug, reason: `${tool.title} בנוי בדיוק לזה.` }
          : undefined,
      },
    };

    return responses[intent] ?? responses.situation;
  }
}
