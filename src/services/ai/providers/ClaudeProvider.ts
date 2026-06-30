/**
 * ClaudeProvider — מימוש אמיתי של IAIProvider נגד Anthropic.
 * משולב עם RAG, system prompt, ו-quote guard.
 *
 * הפעלה: דורש ENV ANTHROPIC_API_KEY ב-Vercel.
 * שימוש: מועבר ל-providerFactory כשהמשתנה NEXT_PUBLIC_AI_PROVIDER=claude.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { IAIProvider, ChatInput } from "../IAIProvider";
import type { CoachResponse } from "@/types/ai";
import { buildSystemPrompt } from "@/prompts/systemPrompt";
import {
  detectSafety,
  SAFETY_RESPONSE,
  isOutputClean,
  fallbackResponse,
} from "@/prompts/guardrails";
import { applyQuoteGuard } from "@/lib/quoteGuard";
import { retrieveExcerpts } from "@/services/rag/retriever";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";
const MAX_OUTPUT_TOKENS = 1200;

export class ClaudeProvider implements IAIProvider {
  name = "claude" as const;
  private client: Anthropic;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("ClaudeProvider: missing ANTHROPIC_API_KEY");
    }
    this.client = new Anthropic({ apiKey: key });
  }

  async chat(input: ChatInput): Promise<CoachResponse> {
    // 1. Safety filter
    const safety = detectSafety(input.userText);
    if (safety.triggered) {
      return {
        ...SAFETY_RESPONSE,
        safetyTriggered: true,
        toolSuggestion: undefined,
      };
    }

    // 2. RAG retrieval
    const excerpts = await retrieveExcerpts({
      query: input.userText,
      intent: input.intent,
      topK: 6,
    });

    // 3. Build prompt
    const systemPrompt = buildSystemPrompt({
      intent: input.intent,
      userText: input.userText,
      memory: input.memory,
      excerpts,
      history: input.history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // 4. Call Claude
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: systemPrompt,
      messages: [
        ...input.history.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user" as const, content: input.userText },
      ],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n");

    // 5. Quote guard
    const { text: guarded } = applyQuoteGuard(
      raw,
      excerpts.map((e) => e.content),
    );

    // 6. Output validation
    if (!isOutputClean(guarded)) {
      return {
        ...fallbackResponse(),
        toolSuggestion: { slug: "whos-driving", reason: "התחל מכאן." },
      };
    }

    // 7. Parse 4-section response
    return parseStructuredResponse(guarded);
  }
}

/**
 * Parser שמפצל את התשובה ל-4 חלקים.
 * המודל מקבל הוראה במבנה זה ב-system prompt.
 * אם הוא לא ציית — כל הטקסט הולך ל-facts.
 */
function parseStructuredResponse(text: string): CoachResponse {
  const factsMatch = /(?:^|\n)[\s*•\-]*\s*(?:1[.\s]+)?(?:מה ה?עובדות[?:]?\s*)/.exec(text);
  const storyMatch = /(?:^|\n)[\s*•\-]*\s*(?:2[.\s]+)?(?:איזה סיפור[^:]*[:?]\s*)/.exec(text);
  const actionMatch = /(?:^|\n)[\s*•\-]*\s*(?:3[.\s]+)?(?:מה ה?פעולה[^:]*[:?]\s*)/.exec(text);
  const toolMatch = /(?:^|\n)[\s*•\-]*\s*(?:4[.\s]+)?(?:איזה כלי[^:]*[:?]\s*)/.exec(text);

  if (!factsMatch) {
    return {
      facts: text.slice(0, 400),
      story: "",
      nextAction: "",
      toolSuggestion: undefined,
    };
  }

  const factsStart = factsMatch.index + factsMatch[0].length;
  const storyStart = storyMatch ? storyMatch.index : text.length;
  const actionStart = actionMatch ? actionMatch.index : text.length;
  const toolStart = toolMatch ? toolMatch.index : text.length;

  const facts = text.slice(factsStart, storyStart).trim();
  const story = storyMatch ? text.slice(storyMatch.index + storyMatch[0].length, actionStart).trim() : "";
  const action = actionMatch ? text.slice(actionMatch.index + actionMatch[0].length, toolStart).trim() : "";
  const toolBlock = toolMatch ? text.slice(toolMatch.index + toolMatch[0].length).trim() : "";

  // ננסה לחלץ slug של כלי מהבלוק האחרון
  const toolSlugMatch = /\b([\w-]+(?:-[\w-]+)+)\b/.exec(toolBlock);
  const toolSuggestion = toolBlock
    ? { slug: toolSlugMatch?.[1] ?? "whos-driving", reason: toolBlock }
    : undefined;

  return {
    facts: stripMarkdown(facts),
    story: stripMarkdown(story),
    nextAction: stripMarkdown(action),
    toolSuggestion,
  };
}

function stripMarkdown(s: string): string {
  return s.replace(/^\*+|\*+$/g, "").replace(/^#+\s*/gm, "").trim();
}
