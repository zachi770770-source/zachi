"use client";

import { useId, useState } from "react";

import type { FactStoryLab } from "@/content/methods";

/**
 * „רגע אחד — שלוש שכבות” — הפעלה של „עובדה, סיפור, פעולה” על רגע אמיתי של
 * הקורא/ת. שני צעדי-בחירה קצרים (רגע → סיפור), ואז ההפרדה עצמה: „מה שקרה” לצד
 * „מה שהוספתם”, עם השורה „רק הראשון קרה באמת”, ואז שאלות-פעולה שנשענות על
 * העובדה. אין ניקוד, אין „נכון/לא-נכון”, אין עצה אלגוריתמית — רק הרגע שבו רואים
 * שהחלק המפחיד לא קרה, אלא סופר.
 *
 * ארכיטקטורה: אי-לקוח קטן. הבחירות הן radiogroups נטיביים (מקלדת + קורא-מסך);
 * המצב ephemeral ב-useState בלבד — אין localStorage, אין רשת, אין אנליטיקה על
 * מה שמקלידים. הטקסט החופשי לא נשמר ולא נשלח לשום מקום. המושג המלא (ההגדרה,
 * הדוגמה מהספר, ה„למה”) נשאר ב-HTML של מקטעי-העמוד — זו רק שכבת ההשתתפות.
 */

const CUSTOM = "__custom__";

export function MethodFactStory({ lab }: { lab: FactStoryLab }) {
  const uid = useId();
  const [moment, setMoment] = useState<string | null>(null);
  const [customMoment, setCustomMoment] = useState("");
  const [story, setStory] = useState<string | null>(null);
  const [customStory, setCustomStory] = useState("");

  const factText =
    moment === CUSTOM
      ? customMoment.trim()
      : moment
        ? (lab.moments.find((m) => m.id === moment)?.fact ?? "")
        : "";
  const storyText = story === CUSTOM ? customStory.trim() : (story ?? "");

  const factChosen = factText.length > 0;
  const storyChosen = storyText.length > 0;

  function reset() {
    setMoment(null);
    setCustomMoment("");
    setStory(null);
    setCustomStory("");
  }

  return (
    <section
      id="fact-story-lab"
      aria-labelledby="fslab-heading"
      className="rounded-2xl border border-border bg-surface p-5 sm:p-7"
    >
      <span className="kicker">{lab.eyebrow}</span>
      <h2 id="fslab-heading" className="mt-3 font-serif text-2xl font-semibold text-foreground">
        {lab.title}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
        {lab.intro}
      </p>

      {/* שלב 1 — העובדה */}
      <fieldset className="mt-6 border-0 p-0">
        <legend className="fslab-step text-[13px] font-bold text-brand-hover">
          1 · {lab.factPrompt}
        </legend>
        <div role="radiogroup" aria-label={lab.factPrompt} className="mt-3 flex flex-wrap gap-2">
          {lab.moments.map((m) => (
            <Chip
              key={m.id}
              name={`${uid}-moment`}
              value={m.id}
              checked={moment === m.id}
              onChange={() => setMoment(m.id)}
              label={m.fact}
            />
          ))}
          <Chip
            name={`${uid}-moment`}
            value={CUSTOM}
            checked={moment === CUSTOM}
            onChange={() => setMoment(CUSTOM)}
            label={lab.customMomentLabel}
          />
        </div>
        {moment === CUSTOM ? (
          <div className="mt-3">
            <label htmlFor={`${uid}-moment-input`} className="sr-only">
              {lab.customMomentPlaceholder}
            </label>
            <input
              id={`${uid}-moment-input`}
              type="text"
              autoComplete="off"
              maxLength={90}
              value={customMoment}
              onChange={(e) => setCustomMoment(e.target.value)}
              placeholder={lab.customMomentPlaceholder}
              className="w-full max-w-[42ch] rounded-xl border border-border-strong bg-background px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-foreground-muted/70 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
            />
          </div>
        ) : null}
      </fieldset>

      {/* שלב 2 — הסיפור (נחשף אחרי שנבחר רגע) */}
      {factChosen ? (
        <fieldset className="fslab-reveal mt-6 border-0 p-0">
          <legend className="fslab-step text-[13px] font-bold text-brand-hover">
            2 · {lab.storyPrompt}
          </legend>
          <div role="radiogroup" aria-label={lab.storyPrompt} className="mt-3 flex flex-wrap gap-2">
            {lab.stories.map((s) => (
              <Chip
                key={s}
                name={`${uid}-story`}
                value={s}
                checked={story === s}
                onChange={() => setStory(s)}
                label={s}
              />
            ))}
            <Chip
              name={`${uid}-story`}
              value={CUSTOM}
              checked={story === CUSTOM}
              onChange={() => setStory(CUSTOM)}
              label={lab.customStoryLabel}
            />
          </div>
          {story === CUSTOM ? (
            <div className="mt-3">
              <label htmlFor={`${uid}-story-input`} className="sr-only">
                {lab.customStoryPlaceholder}
              </label>
              <input
                id={`${uid}-story-input`}
                type="text"
                autoComplete="off"
                maxLength={90}
                value={customStory}
                onChange={(e) => setCustomStory(e.target.value)}
                placeholder={lab.customStoryPlaceholder}
                className="w-full max-w-[42ch] rounded-xl border border-border-strong bg-background px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-foreground-muted/70 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
              />
            </div>
          ) : null}
        </fieldset>
      ) : null}

      {/* ההפרדה + הפעולה (נחשף אחרי שנבחרו רגע וסיפור) */}
      {factChosen && storyChosen ? (
        <div className="fslab-reveal mt-6 border-t border-border pt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-secondary/30 bg-secondary-muted/50 p-4">
              <span className="text-[12px] font-bold uppercase tracking-wide text-secondary">
                {lab.factTag}
              </span>
              <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-foreground [text-wrap:pretty]">
                {factText}
              </p>
            </div>
            <div className="rounded-xl border border-brand/25 bg-brand-muted p-4">
              <span className="text-[12px] font-bold uppercase tracking-wide text-brand-hover">
                {lab.storyTag}
              </span>
              <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-foreground [text-wrap:pretty]">
                {storyText}
              </p>
            </div>
          </div>
          <p className="mt-3 font-serif text-[1.05rem] italic leading-relaxed text-foreground [text-wrap:pretty]">
            {lab.separationLine}
          </p>

          <div className="mt-5 border-t border-border pt-5">
            <span className="kicker">{lab.actionEyebrow}</span>
            <p className="mt-2 text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
              {lab.actionIntro}
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {lab.actionPrompts.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55rem] h-1.5 w-4 shrink-0 rounded-full bg-brand/70"
                  />
                  <span className="text-[15px] leading-relaxed text-foreground/90 [text-wrap:pretty]">
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="max-w-[46ch] text-[14px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
              {lab.closing}
            </p>
            <button
              type="button"
              onClick={reset}
              className="shrink-0 rounded-full border border-border-strong bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {lab.resetLabel}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** צ׳יפ-בחירה נגיש: radio חבוי + תווית גלויה; מודגש כשנבחר (הדגשה ניטרלית). */
function Chip({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="fslab-chip">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span>{label}</span>
    </label>
  );
}
