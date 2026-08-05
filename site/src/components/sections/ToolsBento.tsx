"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { tools, type ToolItem } from "@/content/book";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";

/**
 * „הכלים המעשיים” — אזור Editorial Luxury חם ואינטראקטיבי לששת הכלים מהספר
 * (src/content/book.ts). דסקטופ: Grid 3×2. מובייל: קרוסלה ברוחב ~88% עם הצצה
 * לכרטיס הבא, Swipe (גלילה נטיבית), חצים ומונה 01/06 — ללא autoplay.
 *
 * חזית הכרטיס: מספר, אייקון SVG קווי, שם, שאלה ומשפט הבטחה. לחיצה פותחת חלונית
 * פירוט *אחת ורחבה מתחת לכרטיסים* (תרחיש, יישום, תובנת מפתח) — רק כלי אחד פתוח
 * בכל רגע. אין 3D flip ואין פתיחה ב-hover (hover רק מרים ומדגיש). עוגני
 * `#tool-<id>` נשמרים: קישור ישיר פותח וממקד את הכלי. בכל כלי פתוח CTA אחד בלבד:
 * „קראו קטע מהספר הקשור לכלי” → /preview?tool=<id>&station=<station>.
 *
 * נגישות: הכרטיס הוא כפתור (aria-expanded/aria-controls), ניווט מקלדת, יעדי מגע
 * ≥44px, וכיבוד prefers-reduced-motion (המעברים הם opacity/transform מנוטרלים).
 * ללא JS: ששת הכרטיסים הקדמיים מרונדרים בשרת וקריאים (שם + שאלה + הבטחה).
 */

/** אייקונים קוויים (stroke) — דקורטיביים. שורה אחת פר כלי, לפי בקשת המחבר. */
const ICONS: Record<string, React.ReactNode> = {
  // שעון עצר קווי
  "quiet-check": (
    <>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 13V9.5M12 3h0M10 3h4M18.5 7l1.5-1.5" />
    </>
  ),
  // משולש תפיסתי (שלוש נקודות מחוברות)
  "fact-story-action": (
    <>
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="5.5" cy="18" r="1.4" />
      <circle cx="18.5" cy="18" r="1.4" />
      <path d="M12 6.4 6.2 16.6M12 6.4l5.8 10.2M6.9 18h10.2" />
    </>
  ),
  // סרגל זמן מינימליסטי
  "gate-questions": (
    <>
      <path d="M3 12h18" />
      <path d="M6 9v6M12 8v8M18 9v6" />
    </>
  ),
  // מאזניים מעודנות
  "boundary-ladder": (
    <>
      <path d="M12 4v16M7 20h10" />
      <path d="M5 8h14M5 8l-2.5 5a3 3 0 0 0 5 0L5 8ZM19 8l-2.5 5a3 3 0 0 0 5 0L19 8Z" />
    </>
  ),
  // מראה עגולה עם ידית
  "twenty-maintenance": (
    <>
      <circle cx="12" cy="9.5" r="6" />
      <path d="M12 15.5V21M9 21h6" />
    </>
  ),
  // דלת פתוחה
  "emergency-kit": (
    <>
      <path d="M4 20h16" />
      <path d="M7 20V5l8-2v17" />
      <path d="M15 20V6.5L19 8v12" />
      <path d="M12.5 12h0" />
    </>
  ),
};

function ToolIcon({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="tool-lux-card__svg"
    >
      {ICONS[id] ?? null}
    </svg>
  );
}

export function ToolsBento() {
  const items = tools.items.slice(0, 6);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [active, setActive] = React.useState(0); // אינדקס הכרטיס במרכז (מובייל)
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const panelRef = React.useRef<HTMLDivElement>(null);

  const openTool: ToolItem | null =
    (openId && items.find((t) => t.id === openId)) || null;

  const toggle = (id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
  };

  // deep-link: ‏#tool-<id> פותח את הכלי, גולל אליו וממקד אותו. רץ בטעינה ובכל
  // שינוי hash. הגלילה מיידית (בלי לשבור smooth גלובלי) ומכבדת scroll-mt.
  React.useEffect(() => {
    const openFromHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#tool-")) return;
      const id = hash.slice("#tool-".length);
      if (!items.some((t) => t.id === id)) return;
      setOpenId(id);
      const el = cardRefs.current[id];
      if (!el) return;
      el.focus({ preventScroll: true });
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      el.scrollIntoView({ block: "center", inline: "center" });
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: "center", inline: "center" });
        html.style.scrollBehavior = prev;
      });
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // מונה הקרוסלה במובייל: עוקב אחרי הכרטיס המרכזי דרך IntersectionObserver על
  // ה-viewport עצמו (rootMargin שמצמצם לפס מרכזי). setState רק ב-callback.
  React.useEffect(() => {
    const root = viewportRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const cells = Array.from(root.querySelectorAll<HTMLElement>("[data-cell]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.cell);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { root, threshold: 0.6 }
    );
    cells.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  const scrollToCell = (idx: number) => {
    const clamped = Math.max(0, Math.min(5, idx));
    const root = viewportRef.current;
    const cell = root?.querySelector<HTMLElement>(`[data-cell="${clamped}"]`);
    cell?.scrollIntoView({ block: "nearest", inline: "center" });
  };

  return (
    <section
      id="tools"
      className="tools-lux scroll-mt-20 py-16 sm:py-20"
      aria-labelledby="tools-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">כלים, לא רק רעיון</span>
          <h2 id="tools-heading" className="type-h2 mt-4">
            {tools.title}
          </h2>
          <p className="type-lead mt-4 text-foreground-muted">{tools.description}</p>
        </Reveal>

        {/* קרוסלה במובייל (Swipe נטיבי, scroll-snap) / Grid 3×2 בדסקטופ. */}
        <Reveal>
          <div ref={viewportRef} className="tools-lux__viewport mt-10 sm:mt-12">
            <ol className="tools-lux__track">
              {items.map((tool, i) => {
                const open = openId === tool.id;
                return (
                  <li key={tool.id} data-cell={i} className="tools-lux__cell">
                    <button
                      type="button"
                      id={`tool-${tool.id}`}
                      ref={(el) => {
                        cardRefs.current[tool.id] = el;
                      }}
                      aria-expanded={open}
                      aria-controls="tool-detail-panel"
                      data-open={open ? "" : undefined}
                      onClick={() => toggle(tool.id)}
                      className="tool-lux-card scroll-mt-24"
                    >
                      <span className="tool-lux-card__top">
                        <span className="tool-lux-card__num" aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="tool-lux-card__icon" aria-hidden="true">
                          <ToolIcon id={tool.id} />
                        </span>
                      </span>
                      <h3 className="tool-lux-card__name">{tool.name}</h3>
                      <p className="tool-lux-card__q">{tool.question}</p>
                      <p className="tool-lux-card__promise">{tool.description}</p>
                      <span className="tool-lux-card__more" aria-hidden="true">
                        {open ? "סגירה" : "פתחו את הכלי"}
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* בקרות הקרוסלה — מובייל בלבד: חצים + מונה 01/06 (ללא autoplay).
              display נשלט ע"י utilities (flex sm:hidden) — ראו ההערה ב-CSS. */}
          <div className="tools-lux__nav flex sm:hidden">
            <button
              type="button"
              onClick={() => scrollToCell(active - 1)}
              disabled={active === 0}
              aria-label="הכלי הקודם"
              className="tools-lux__arrow"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="tools-lux__counter" aria-live="polite">
              {String(active + 1).padStart(2, "0")}
              <span className="tools-lux__counter-sep"> / </span>
              {String(items.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => scrollToCell(active + 1)}
              disabled={active === items.length - 1}
              aria-label="הכלי הבא"
              className="tools-lux__arrow"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </Reveal>

        {/* חלונית פירוט אחת מתחת לכרטיסים — רק הכלי הפתוח. */}
        <div
          id="tool-detail-panel"
          ref={panelRef}
          role="region"
          aria-live="polite"
          aria-label={openTool ? `פירוט הכלי: ${openTool.name}` : "פירוט הכלי"}
          className={`tool-lux-panel${openTool ? " is-open" : ""}`}
        >
          {openTool ? (
            <div className="tool-lux-panel__inner">
              <div className="tool-lux-panel__head">
                <span className="kicker">הכלי שבחרתם</span>
                <h3 className="tool-lux-panel__name">{openTool.name}</h3>
                <p className="tool-lux-panel__q">{openTool.question}</p>
              </div>

              <div className="tool-lux-panel__grid">
                <div className="tool-lux-panel__block">
                  <p className="tool-lux-panel__label">תרחיש מהחיים</p>
                  <p className="tool-lux-panel__text">{openTool.scenario}</p>
                </div>
                <div className="tool-lux-panel__block">
                  <p className="tool-lux-panel__label">איך מיישמים</p>
                  <p className="tool-lux-panel__text">{openTool.application}</p>
                </div>
              </div>

              <blockquote className="tool-lux-panel__insight">
                {openTool.insight}
                <cite className="tool-lux-panel__cite">— צחי חן</cite>
              </blockquote>

              {/* CTA יחיד לכל כלי פתוח — קטע מהספר הקשור לכלי (ללא הרשמה). */}
              <Link
                href={`/preview?tool=${openTool.id}&station=${openTool.station}`}
                className="tool-lux-panel__cta"
              >
                קראו קטע מהספר הקשור לכלי
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
