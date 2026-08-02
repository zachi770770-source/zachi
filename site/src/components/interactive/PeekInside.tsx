"use client";

import * as React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { preview, tools } from "@/content/book";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { WaitlistCta } from "@/components/waitlist/WaitlistCta";

/** כלי-שער אמיתי מתוך הספר (src/content/book.ts) — לא ממציאים תוכן. */
const SIGNATURE_TOOL =
  tools.items.find((t) => t.name === "שלוש שאלות השער") ?? tools.items[0];

type PanelId = "cover" | "contents" | "excerpt" | "tool";
const PANELS: { id: PanelId; label: string }[] = [
  { id: "cover", label: "עטיפה" },
  { id: "contents", label: "מבנה" },
  { id: "excerpt", label: "קטע" },
  { id: "tool", label: "כלי" },
];

/**
 * „הצצה לספר” — חוויית הצצה אינטראקטיבית אחת בעמוד הבית: עטיפה אמיתית,
 * מבנה (תוכן העניינים הקיים), קטע אמיתי אחד וכלי מעשי אמיתי אחד. כל התוכן
 * קיים (src/content/book.ts, siteConfig.images) וה-CTA מפנה ל-/preview.
 *
 * נגישות: tablist/tab/tabpanel נטיביים, roving tabindex, ניווט מקלדת
 * (חיצים RTL, Home/End), כפתורי הקודם/הבא גלויים, וב-מובייל גם החלקה (swipe).
 * מכבד prefers-reduced-motion (החלפת הפאנל היא opacity בלבד, מנוטרלת גלובלית).
 */
export function PeekInside() {
  const [index, setIndex] = React.useState(0);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const touchX = React.useRef<number | null>(null);

  // מעבר „דף ספר” מרוסן (PHASE MOTION 4-B): בעת מעבר לשונית, הדף היוצא מסתובב
  // הצידה ונמוג מעל הדף הנכנס. תחת reduced-motion אין שכבה יוצאת — החלפה מיידית.
  const [leaving, setLeaving] = React.useState<{ id: PanelId; nonce: number } | null>(null);
  const nonceRef = React.useRef(0);
  const indexRef = React.useRef(index);
  React.useEffect(() => {
    indexRef.current = index; // סנכרון ref בלבד (ללא setState)
  }, [index]);

  const go = React.useCallback((next: number, focus = false) => {
    const cur = indexRef.current;
    const clamped = Math.max(0, Math.min(PANELS.length - 1, next));
    if (clamped !== cur) {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) {
        nonceRef.current += 1;
        setLeaving({ id: PANELS[cur].id, nonce: nonceRef.current });
      }
    }
    setIndex(clamped);
    if (focus) tabRefs.current[clamped]?.focus();
  }, []);

  // ניווט מקלדת ב-tablist (RTL: חץ שמאל = הבא, חץ ימין = הקודם).
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        go(index + 1, true);
        break;
      case "ArrowRight":
        e.preventDefault();
        go(index - 1, true);
        break;
      case "Home":
        e.preventDefault();
        go(0, true);
        break;
      case "End":
        e.preventDefault();
        go(PANELS.length - 1, true);
        break;
    }
  };

  // החלקה במובייל: RTL — החלקה שמאלה (dx<0) = הבא, ימינה = הקודם.
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
    if (Math.abs(dx) > 45) go(dx < 0 ? index + 1 : index - 1);
    touchX.current = null;
  };

  const active = PANELS[index].id;

  // גיבוי: ניקוי השכבה היוצאת גם אם animationend לא נורה.
  React.useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(null), 620);
    return () => clearTimeout(t);
  }, [leaving]);

  const renderPanel = (id: PanelId) => {
    if (id === "cover") {
      return (
        <div className="flex flex-col items-center gap-5 py-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
          <div className="w-[132px] shrink-0 sm:w-[150px]">
            <BookCover />
          </div>
          <div className="text-center sm:text-start">
            <p className="font-serif text-2xl font-semibold text-foreground">
              {siteConfig.bookTitle}
            </p>
            <p className="mt-1 text-[15px] text-foreground-muted">
              מאת {siteConfig.author.name}
            </p>
            <p className="mt-3 max-w-[34ch] font-quote text-[1.05rem] italic leading-relaxed text-brand-hover">
              {siteConfig.tagline}
            </p>
          </div>
        </div>
      );
    }
    if (id === "contents") {
      return (
        <div className="px-1 py-2">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            מבנה הספר
          </h3>
          <ol className="mt-4">
            {preview.tableOfContents.map((chapter, i) => (
              <li
                key={chapter}
                className="flex items-baseline gap-3 border-t border-border py-3 last:border-b"
              >
                <span
                  aria-hidden="true"
                  className="type-quote w-7 shrink-0 text-brand tabular-nums"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[16px] leading-snug text-foreground">
                  {chapter}
                </span>
              </li>
            ))}
          </ol>
        </div>
      );
    }
    if (id === "excerpt") {
      return (
        <div className="px-1 py-3">
          <p className="kicker">{preview.excerptTitle}</p>
          <blockquote className="mt-4 border-s-2 border-brand ps-5 font-quote text-[1.2rem] italic leading-[1.85] text-foreground [text-wrap:pretty]">
            {preview.excerpt}
          </blockquote>
        </div>
      );
    }
    return (
      <div className="px-1 py-3">
        <p className="kicker">כלי מעשי מהספר</p>
        <h3 className="mt-3 font-serif text-xl font-semibold text-foreground">
          {SIGNATURE_TOOL.name}
        </h3>
        <p className="mt-3 text-[1.05rem] leading-relaxed text-foreground-muted">
          {SIGNATURE_TOOL.description}
        </p>
      </div>
    );
  };

  return (
    <section
      id="sample"
      className="scroll-mt-20 bg-surface-muted py-14 sm:py-16"
      aria-labelledby="peek-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">הצצה לספר</span>
          <h2 id="peek-heading" className="type-h2 mt-4">
            כמה שורות, כדי שתדעו לאן אתם נכנסים
          </h2>
        </div>

        <div className="mx-auto mt-9 max-w-3xl rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
          {/* לשוניות */}
          <div
            role="tablist"
            aria-label="הצצה לספר"
            className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl bg-surface-muted p-1.5"
            onKeyDown={onKeyDown}
          >
            {PANELS.map((panel, i) => {
              const selected = i === index;
              return (
                <button
                  key={panel.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`peek-tab-${panel.id}`}
                  aria-selected={selected}
                  aria-controls={`peek-panel-${panel.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => go(i)}
                  className={`min-h-[40px] rounded-lg px-4 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    selected
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {panel.label}
                </button>
              );
            })}
          </div>

          {/* פאנל תוכן — משתנה לפי הלשונית. swipe במובייל. */}
          <div
            role="tabpanel"
            id={`peek-panel-${active}`}
            aria-labelledby={`peek-tab-${active}`}
            tabIndex={0}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="mt-5 min-h-[220px] rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <div className="peek-stage">
              <div key={active} className="peek-page peek-page--enter">
                {renderPanel(active)}
              </div>
              {leaving ? (
                <div
                  key={leaving.nonce}
                  className="peek-page peek-page--leave"
                  aria-hidden="true"
                  onAnimationEnd={() => setLeaving(null)}
                >
                  {renderPanel(leaving.id)}
                </div>
              ) : null}
            </div>
          </div>

          {/* בקרות הקודם/הבא גלויות + מונה */}
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label="ההצצה הקודמת"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-strong text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="text-[13px] font-medium tabular-nums text-foreground-muted">
              {index + 1} / {PANELS.length}
            </span>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === PANELS.length - 1}
              aria-label="ההצצה הבאה"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-strong text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* פעולת ההמרה האחידה — מיד אחרי ההצצה (PHASE 16). הרשמה מוצלחת
            פותחת את /preview; „טעימה” בתפריט נשארת נגישה לכולם ישירות. */}
        <div className="mt-8 flex justify-center">
          <WaitlistCta source="sample" align="center" />
        </div>
      </Container>
    </section>
  );
}
