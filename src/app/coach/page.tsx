"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  NotebookPen,
  Compass,
  MessagesSquare,
  Send,
  Wrench,
  ShieldAlert,
  RefreshCcw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Quote } from "@/components/ui/Quote";
import { useCoachStore } from "@/store/useCoachStore";
import { useAppStore } from "@/store/useAppStore";
import { askCoachClient } from "@/services/ai/coachClient";
import { findTool } from "@/content/tools";
import type { CoachIntent } from "@/types";

const INTENTS: Array<{
  key: CoachIntent;
  title: string;
  description: string;
  icon: typeof Search;
}> = [
  {
    key: "situation",
    title: "ניתוח סיטואציה",
    description: "תאר/י מצב מהחיים, ונפרק יחד מה העובדה ומה הסיפור.",
    icon: Search,
  },
  {
    key: "date",
    title: "ניתוח דייט",
    description: "מה היה — ואיך באמת הרגיש לי שם.",
    icon: Calendar,
  },
  {
    key: "journal",
    title: "יומן זוגיות",
    description: "מחשבה, אירוע, תחושה. אני אעזור לזהות דפוסים.",
    icon: NotebookPen,
  },
  {
    key: "plan",
    title: "תוכנית אישית",
    description: "מה לתרגל השבוע, על בסיס האבחון.",
    icon: Compass,
  },
  {
    key: "conversation",
    title: "תרגול שיחה",
    description: "איך לנסח שיחה קשה — מהודעה ועד שיחת בלעדיות.",
    icon: MessagesSquare,
  },
];

export default function CoachPage() {
  const { intent, setIntent, messages, addMessage, clearMessages } = useCoachStore();
  const appState = useAppStore();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const handleSend = async () => {
    if (!intent || !text.trim() || pending) return;
    const userText = text.trim();
    addMessage({
      role: "user",
      content: userText,
      intent,
      timestamp: new Date().toISOString(),
    });
    setText("");
    setPending(true);

    try {
      const response = await askCoachClient(
        intent,
        userText,
        messages,
        {
          segment: appState.segment,
          diagnosisHistory: appState.diagnosisHistory,
          toolUsage: appState.toolUsage,
          catches: appState.catches,
        },
      );

      const composedContent = response.safetyTriggered
        ? `🛡 ${response.facts}\n\n${response.story}\n\n${response.nextAction}`
        : `**מה העובדות?**\n${response.facts}\n\n**מה הסיפור שאתה אולי מספר?**\n${response.story}\n\n**הפעולה הבאה הבריאה:**\n${response.nextAction}`;

      addMessage({
        role: "assistant",
        content: composedContent,
        intent,
        toolSuggestionSlug: response.toolSuggestion?.slug,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      addMessage({
        role: "assistant",
        content: "אופס, משהו השתבש. ננסה שוב?",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setPending(false);
    }
  };

  // אם לא נבחר intent — מסך בחירה
  if (!intent) {
    return (
      <main className="animate-fade-in">
        <PageHeader
          eyebrow="המאמן"
          title="במה אני יכול לעזור?"
          description="עונה רק לפי הספר, השיטה והכלים. בלי ייעוץ קליני, בלי אבחנות."
          showBack={false}
        />

        <div className="px-5 space-y-3 pb-8">
          {INTENTS.map(({ key, title, description, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setIntent(key)}
              className="w-full text-right"
            >
              <Card className="hover:bg-sand-100 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-clay-100 text-clay-500 grid place-items-center shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-700">{title}</p>
                    <p className="text-sm text-ink-500 mt-1 leading-relaxed">{description}</p>
                  </div>
                </div>
              </Card>
            </button>
          ))}

          {messages.length > 0 && (
            <Card tone="muted" className="mt-6">
              <p className="text-xs text-ink-400 mb-2">היסטוריית שיחה קודמת</p>
              <p className="text-sm text-ink-500 mb-3">{messages.length} הודעות שמורות במכשיר.</p>
              <Button onClick={clearMessages} variant="ghost" size="sm">
                <RefreshCcw className="size-3.5" />
                לאפס שיחה
              </Button>
            </Card>
          )}

          <Quote source="עקרון המאמן" className="pt-6">
            המאמן עונה רק לפי הספר. הוא לא מאבחן, לא ממליץ פרידה, ולא מחליף עזרה מקצועית.
          </Quote>
        </div>
      </main>
    );
  }

  const currentIntent = INTENTS.find((i) => i.key === intent);

  return (
    <main className="animate-fade-in flex flex-col" style={{ minHeight: "calc(100vh - 7rem)" }}>
      <PageHeader
        eyebrow="המאמן"
        title={currentIntent?.title ?? "שיחה"}
        description={currentIntent?.description}
        showBack={false}
      />

      <div className="px-5 mb-3">
        <Button onClick={() => setIntent(null)} variant="ghost" size="sm">
          ← לבחירת נושא אחר
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 px-5 space-y-3 overflow-y-auto pb-4"
      >
        {messages.length === 0 && (
          <Card tone="muted">
            <p className="text-ink-500 leading-relaxed text-sm">
              תאר/י במשפט או שניים מה קרה. המאמן יחזיר תשובה במבנה: <strong>עובדה → סיפור → פעולה → כלי</strong>.
            </p>
          </Card>
        )}

        {messages
          .filter((m) => m.intent === intent || !m.intent)
          .map((m, i) => (
            <CoachMessageBubble key={i} message={m} />
          ))}

        {pending && (
          <Card tone="muted" className="max-w-[85%]">
            <div className="flex items-center gap-2 text-ink-400">
              <span className="size-2 bg-clay-300 rounded-full animate-pulse" />
              <span className="size-2 bg-clay-300 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <span className="size-2 bg-clay-300 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </Card>
        )}
      </div>

      <div className="sticky bottom-20 bg-sand-50 px-5 pt-2 pb-3 border-t border-sand-200">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="תאר/י מצב, מחשבה או דייט…"
          className="min-h-[80px]"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-[11px] text-ink-300">
            המאמן אינו תחליף לטיפול. בכל מצוקה — פנו לעזרה מקצועית.
          </p>
          <Button onClick={handleSend} disabled={!text.trim() || pending} size="sm">
            <Send className="size-4" />
            שלח
          </Button>
        </div>
      </div>
    </main>
  );
}

function CoachMessageBubble({ message }: { message: ReturnType<typeof useCoachStore.getState>["messages"][number] }) {
  const tool = message.toolSuggestionSlug ? findTool(message.toolSuggestionSlug) : null;
  const isAssistant = message.role === "assistant";
  const isSafety = message.content.startsWith("🛡");

  return (
    <div className={isAssistant ? "max-w-[92%]" : "max-w-[85%] ml-auto"}>
      <Card tone={isSafety ? "warm" : isAssistant ? "default" : "muted"}>
        {isSafety && (
          <div className="flex items-center gap-2 mb-2 text-accent-400">
            <ShieldAlert className="size-4" />
            <span className="text-xs font-medium">בטיחות</span>
          </div>
        )}
        <p className="text-ink-700 leading-relaxed whitespace-pre-wrap text-sm">
          {message.content.replace(/^🛡\s*/, "")}
        </p>
      </Card>

      {isSafety && (
        <Link href="/safety">
          <Card tone="warm" className="mt-2 hover:bg-sand-200 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 text-accent-500">
              <ShieldAlert className="size-4" />
              <span className="text-sm font-medium">למסך הבטיחות</span>
            </div>
          </Card>
        </Link>
      )}

      {tool && (
        <Link href={`/tools/${tool.slug}`}>
          <Card className="mt-2 hover:bg-sand-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Wrench className="size-4 text-clay-400" />
              <div className="flex-1">
                <p className="text-xs text-ink-400">כלי שיכול לעזור עכשיו</p>
                <p className="font-medium text-ink-700 text-sm">{tool.title}</p>
              </div>
              <span className="text-xs text-clay-500">פתח →</span>
            </div>
          </Card>
        </Link>
      )}
    </div>
  );
}
