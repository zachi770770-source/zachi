"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw, ShieldAlert } from "lucide-react";

import {
  askStations,
  dilemmasFor,
  getDilemma,
  askSafety,
  askUi,
  type AskStationId,
  type Dilemma,
} from "@/content/askRoute";
import { tools } from "@/content/book";
import {
  routeIllustrations,
  type IllustratedStationId,
} from "@/content/routeIllustrations";
import { RouteIllustration } from "@/components/shared/RouteIllustration";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { loadAsk, saveAsk, clearAsk } from "@/lib/ask/askStorage";
import { trackEvent } from "@/lib/analytics";

/**
 * „שאל את הספר” — מנוע הכוונה אישי, סגור ודטרמיניסטי, כשיחה מודרכת עם תוכן הספר
 * (לא מבחן אישיות, לא AI, לא צ׳אט, בלי תיבת-טקסט). שלוש שכבות: תחנה → דילמה →
 * שאלת-הקשר *אחת בלבד* (רק כשהיא משנה את התשובה) → תוצאה בת 8 חלקים. שכבת בטיחות
 * דורסת את התוצאה במצבי סכנה/מצוקה. שמירה מקומית מינימלית (תחנה+דילמה) לחזרה
 * למסלול, עם איפוס ברור. מזהים בלבד לאנליטיקה — לעולם לא טקסט אישי.
 */

type Step = "station" | "dilemma" | "context" | "result" | "safety";

export function AskRoute({
  initialStation,
}: {
  /**
   * הקשר-מסע מהבית: כשהתחנה כבר נבחרה ב„איפה זה פוגש אותך עכשיו?”, מדלגים על
   * שאלת „איפה אתם?” ומתחילים בדילמה. undefined → מתחילים מבחירת התחנה (רגיל).
   */
  initialStation?: AskStationId;
} = {}) {
  const [step, setStep] = React.useState<Step>("station");
  const [stationId, setStationId] = React.useState<AskStationId | null>(null);
  const [dilemmaId, setDilemmaId] = React.useState<string | null>(null);
  const [ctxId, setCtxId] = React.useState<string | null>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    trackEvent("ask_open");
  }, []);

  // מעבר ראשוני (אחרי הידרציה, ב-rAF — בלי אי-התאמה מול ה-SSR של מסך התחנות):
  //  1. הקשר-מסע מהבית (`?station=`) גובר — כוונה טרייה ומפורשת: מדלגים על „איפה
  //     אתם?” ומתחילים בדילמה של אותה תחנה.
  //  2. אחרת, מבקר חוזר עם מסלול שמור → מציג את התוצאה ישירות (המשך מסלול).
  //  3. אחרת — מתחילים רגיל מבחירת התחנה.
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (initialStation) {
        setStationId(initialStation);
        setDilemmaId(null);
        setCtxId(null);
        setStep("dilemma");
        trackEvent("ask_station", { station: initialStation, via: "home" });
        return;
      }
      const saved = loadAsk();
      if (!saved) return;
      setStationId(saved.stationId);
      setDilemmaId(saved.dilemmaId);
      setStep("result");
    });
    return () => cancelAnimationFrame(raf);
  }, [initialStation]);

  const dilemma = getDilemma(dilemmaId) ?? null;

  const chooseStation = (id: AskStationId) => {
    setStationId(id);
    setDilemmaId(null);
    setCtxId(null);
    trackEvent("ask_station", { station: id });
    setStep("dilemma");
  };

  const chooseDilemma = (d: Dilemma) => {
    setDilemmaId(d.id);
    setCtxId(null);
    trackEvent("ask_dilemma", { dilemma: d.id });
    if (stationId) saveAsk({ stationId, dilemmaId: d.id });
    if (d.context) {
      setStep("context");
    } else {
      trackEvent("ask_result", { dilemma: d.id });
      setStep("result");
    }
  };

  const chooseContext = (optionId: string) => {
    if (!dilemma?.context) return;
    const opt = dilemma.context.options.find((o) => o.id === optionId);
    trackEvent("ask_context", { dilemma: dilemma.id, context: optionId });
    if (opt?.safety) {
      trackEvent("ask_safety", { dilemma: dilemma.id });
      setStep("safety");
      return;
    }
    setCtxId(optionId);
    trackEvent("ask_result", { dilemma: dilemma.id });
    setStep("result");
  };

  const changeStation = () => {
    trackEvent("ask_change", { to: "station" });
    setStep("station");
  };
  const changeDilemma = () => {
    trackEvent("ask_change", { to: "dilemma" });
    setStep("dilemma");
  };
  const restart = () => {
    setStationId(null);
    setDilemmaId(null);
    setCtxId(null);
    clearAsk();
    trackEvent("ask_restart");
    setStep("station");
  };

  // ניהול פוקוס נגיש: בכל מעבר-שלב (למעט הרינדור הראשון, שבו רדיקס כבר ממקד את
  // החלונית) מעבירים את הפוקוס לכותרת השלב החדש, כדי שקורא-מסך „ינחת” על התוכן
  // ולא יישאר על כפתור שנעלם. אותה כותרת (headingRef) מוזרקת לכל שלב פעיל.
  const firstRenderRef = React.useRef(true);
  React.useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const el = headingRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollIntoView({ block: "nearest" });
      el.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [step]);

  const station = stationId ? askStations.find((s) => s.id === stationId) ?? null : null;

  // הכרזת-התקדמות לקורא-מסך (aria-live) בכל מעבר-שלב — בלי תלות בפוקוס.
  const stepAnnounce: Record<Step, string> = {
    station: "שלב ראשון: איפה אתם עכשיו?",
    dilemma: "שלב הבא: מה הכי מעסיק אתכם כרגע?",
    context: "שאלה משלימה אחת",
    result: "ההכוונה מתוך הספר מוכנה",
    safety: "מידע חשוב",
  };

  return (
    <div className="pathfinder mx-auto max-w-2xl">
      {/* הכרזת-התקדמות נגישה (מוסתרת חזותית) — קורא-מסך שומע לאיזה שלב עברנו. */}
      <div className="sr-only" role="status" aria-live="polite">
        {stepAnnounce[step]}
      </div>
      {/* פירורי-דרך עדינים (שיחה מודרכת, לא מבחן) */}
      {station && step !== "station" ? (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-[13px] text-foreground-muted">
          <span className="rounded-full bg-surface-muted px-2.5 py-1 font-medium text-foreground">
            {station.name}
          </span>
          {dilemma && step !== "dilemma" ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="max-w-[24ch] truncate">{dilemma.label}</span>
            </>
          ) : null}
        </div>
      ) : null}

      {/* עטיפת-שלב עם key=step: כל מעבר מרנדר מחדש ומפעיל אנימציית כניסה חלקה
          (fade + slide) דרך .ask-step ב-globals.css. */}
      <div key={step} className="ask-step">
      {step === "station" ? (
        <Choice
          title={askUi.stationTitle}
          headingRef={headingRef}
          options={askStations.map((s) => ({
            key: s.id,
            label: s.name,
            hint: s.tagline,
          }))}
          selectedKey={stationId}
          onChoose={(k) => chooseStation(k as AskStationId)}
        />
      ) : null}

      {step === "dilemma" && stationId ? (
        <Choice
          title={askUi.dilemmaTitle}
          headingRef={headingRef}
          options={dilemmasFor(stationId).map((d) => ({ key: d.id, label: d.label }))}
          selectedKey={dilemmaId}
          onBack={() => setStep("station")}
          backLabel={askUi.labels.changeStation}
          onChoose={(k) => {
            const d = getDilemma(k);
            if (d) chooseDilemma(d);
          }}
        />
      ) : null}

      {step === "context" && dilemma?.context ? (
        <Choice
          title={dilemma.context.question}
          headingRef={headingRef}
          options={dilemma.context.options.map((o) => ({ key: o.id, label: o.label }))}
          selectedKey={ctxId}
          onBack={() => setStep("dilemma")}
          backLabel={askUi.labels.changeDilemma}
          onChoose={chooseContext}
        />
      ) : null}

      {step === "result" && dilemma ? (
        <Result
          dilemma={dilemma}
          stationId={stationId}
          ctxId={ctxId}
          headingRef={headingRef}
          onChangeDilemma={changeDilemma}
          onChangeStation={changeStation}
          onRestart={restart}
          onSafety={() => {
            trackEvent("ask_safety", { dilemma: dilemma.id, from: "result" });
            setStep("safety");
          }}
        />
      ) : null}

      {step === "safety" ? (
        <Safety headingRef={headingRef} onBack={() => setStep(dilemma ? "result" : "station")} onRestart={restart} />
      ) : null}
      </div>
    </div>
  );
}

/** מסך-בחירה נגיש (radiogroup) — תחנה / דילמה / הקשר. */
function Choice({
  title,
  options,
  selectedKey,
  onChoose,
  onBack,
  backLabel,
  headingRef,
}: {
  title: string;
  options: { key: string; label: string; hint?: string }[];
  selectedKey: string | null;
  onChoose: (key: string) => void;
  onBack?: () => void;
  backLabel?: string;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="pathfinder__q rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8">
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="font-serif text-[1.5rem] font-semibold leading-snug text-foreground focus:outline-none"
      >
        {title}
      </h3>
      <div role="radiogroup" aria-label={title} className="mt-6 grid gap-2.5 text-start">
        {options.map(({ key, label, hint }) => {
          const selected = selectedKey === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChoose(key)}
              className={`lift-hover group flex items-center justify-between gap-3 rounded-xl border px-5 py-4 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                selected
                  ? "border-brand bg-brand-muted/50"
                  : "border-border-strong bg-surface hover:border-brand/40 hover:bg-surface-muted"
              }`}
            >
              <span className="flex flex-col">
                <span className="text-[1.02rem] font-medium text-foreground">{label}</span>
                {hint ? (
                  <span className="mt-0.5 text-[13px] text-foreground-muted">{hint}</span>
                ) : null}
              </span>
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  selected
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border-strong text-transparent"
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          {backLabel ?? askUi.labels.back}
        </button>
      ) : null}
    </div>
  );
}

/** תוצאת-דילמה בת 8 חלקים (+ התאמת-הקשר כשנבחרה). */
function Result({
  dilemma,
  stationId,
  ctxId,
  headingRef,
  onChangeDilemma,
  onChangeStation,
  onRestart,
  onSafety,
}: {
  dilemma: Dilemma;
  stationId: AskStationId | null;
  ctxId: string | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onChangeDilemma: () => void;
  onChangeStation: () => void;
  onRestart: () => void;
  onSafety: () => void;
}) {
  const a = dilemma.answer;
  const isAfterBreakup = stationId === "after-breakup";
  const opener = isAfterBreakup ? askUi.openerAfterBreakup : askUi.openerStation;
  // איור מאושר לתחנה (רק לתחנות שיש להן איור — „חיפוש ודייטים” נשארת ללא איור).
  const illustration =
    stationId && stationId !== "dating"
      ? routeIllustrations[stationId as IllustratedStationId]
      : null;
  const opt = dilemma.context?.options.find((o) => o.id === ctxId);
  const adapt = opt?.adapt ?? null;
  const tool = a.toolId ? tools.items.find((t) => t.id === a.toolId) ?? null : null;
  const action = adapt?.action ?? a.action;
  const checks = [...a.checks, ...(adapt?.checks ?? [])];
  const L = askUi.labels;

  return (
    <article
      className="stuck-answer rounded-2xl border border-border bg-surface p-6 text-start sm:p-8"
      aria-live="polite"
    >
      {illustration ? (
        <RouteIllustration illustration={illustration} className="mb-5 max-w-md" />
      ) : null}
      <p className="text-[14px] font-semibold text-brand-hover">{opener}</p>
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 scroll-mt-24 font-serif text-[1.35rem] font-semibold leading-snug text-foreground focus:outline-none"
      >
        {dilemma.label}
      </h3>

      {/* 1. שיקוף קצר */}
      <p className="mt-3 text-[1.05rem] leading-[1.75] text-foreground">{a.reflection}</p>

      {/* „אחרי פרידה” היא תחנת-מעבר — התוצאה לא דוחפת לכיוון, מזכירה שמותר לא למהר. */}
      {isAfterBreakup ? (
        <p className="mt-3 rounded-xl bg-surface-muted/70 px-4 py-3 text-[14px] leading-relaxed text-foreground-muted">
          זו תחנת מעבר. אין כאן כיוון „נכון” — לא חזרה ולא דייטים חדשים. מותר לעצור,
          לעבד ולהבין לפני שמחליטים לאן.
        </p>
      ) : null}

      {/* התאמת-הקשר (פרק ב' וכו') — רק כשנבחרה */}
      {adapt?.note ? (
        <div className="mt-4 rounded-xl border border-brand/30 bg-brand-muted/30 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-hover">
            {L.adapt}
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">{adapt.note}</p>
        </div>
      ) : null}

      {/* 2. ההבחנה המרכזית */}
      <Block label={L.distinction}>
        <p className="font-serif text-[1.12rem] leading-snug text-foreground">{a.distinction}</p>
      </Block>

      {/* 3. מה כדאי לבדוק */}
      <Block label={L.checks}>
        <ul className="space-y-1.5">
          {checks.map((c) => (
            <li key={c} className="flex gap-2 text-[15px] leading-relaxed text-foreground-muted">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {c}
            </li>
          ))}
        </ul>
      </Block>

      {/* 4. הכלי המתאים */}
      {tool ? (
        <div className="mt-5 rounded-xl border-s-2 border-brand bg-surface-muted/60 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-hover">
            {L.tool}
          </p>
          <Link
            href={`/book#tool-${tool.id}`}
            onClick={() => trackEvent("ask_tool_click", { tool: tool.id })}
            className="mt-1.5 inline-block font-serif text-[1.12rem] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {tool.name}
          </Link>
          <p className="mt-1 text-[15px] leading-relaxed text-foreground-muted">{tool.description}</p>
        </div>
      ) : null}

      {/* 5. פעולה קטנה להיום */}
      <Block label={L.action}>
        <p className="text-[15px] leading-relaxed text-foreground">{action}</p>
      </Block>

      {/* 6. מה לא כדאי להסיק מהר מדי */}
      <Block label={L.avoid}>
        <p className="text-[15px] leading-relaxed text-foreground-muted">{a.avoid}</p>
      </Block>

      {/* 7 + 8. קטע מהספר + המשך */}
      <div className="mt-6 flex flex-col gap-3">
        {tool ? (
          <Link
            href={`/preview?tool=${tool.id}&station=${a.sampleStation}`}
            onClick={() => trackEvent("ask_sample_click", { tool: tool.id })}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[16px] font-semibold text-surface transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {L.sampleCta}
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
        {/* נקודת High Intent בסוף הכיוון: אמזון הוא ערוץ הרכישה היחיד. */}
        <AmazonBuyLink
          source="book"
          className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          הספר המלא זמין עכשיו באמזון
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
            aria-hidden="true"
          />
        </AmazonBuyLink>
      </div>

      <p className="mt-6 border-t border-border pt-4 text-[13px] leading-relaxed text-foreground-muted">
        {askUi.disclaimer}
      </p>

      {/* המשך: דילמה אחרת / תחנה אחרת / התחלה מחדש */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] font-medium">
        <button type="button" onClick={onChangeDilemma} className="inline-flex items-center gap-1.5 text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          {L.changeDilemma}
        </button>
        <button type="button" onClick={onChangeStation} className="inline-flex items-center gap-1.5 text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          {L.changeStation}
        </button>
        <button type="button" onClick={onRestart} className="inline-flex items-center gap-1.5 text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {L.restart}
        </button>
      </div>

      {/* ניתוב-בטיחות עדין (לא שאלון-כניסה מאיים) — נגיש כשצריך. */}
      <button
        type="button"
        onClick={onSafety}
        className="mt-4 inline-flex items-start gap-1.5 text-[12.5px] leading-relaxed text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      >
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden="true" />
        יש בבית פחד, שליטה או סכנה? זה לא המקום — לחצו כאן.
      </button>
    </article>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-hover">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/** שכבת בטיחות — דורסת את התוצאה הרגילה. אין עצה זוגית. */
function Safety({
  headingRef,
  onBack,
  onRestart,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onRestart: () => void;
}) {
  return (
    <article
      className="stuck-answer rounded-2xl border border-secondary/40 bg-secondary-muted p-6 text-start sm:p-8"
      aria-live="assertive"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-secondary" aria-hidden="true">
        <ShieldAlert className="h-5 w-5" />
      </span>
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 font-serif text-[1.35rem] font-semibold leading-snug text-foreground focus:outline-none"
      >
        {askSafety.title}
      </h3>
      <p className="mt-3 text-[1.05rem] leading-[1.75] text-foreground">{askSafety.body}</p>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground">{askSafety.note}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] font-medium">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          חזרה
        </button>
        <button type="button" onClick={onRestart} className="inline-flex items-center gap-1.5 text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          להתחיל מחדש
        </button>
      </div>
    </article>
  );
}
