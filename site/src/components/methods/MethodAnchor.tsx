import { ArrowLeft } from "lucide-react";

import type { MethodAnchor as MethodAnchorData } from "@/content/methods";

/**
 * „עוגן חזותי” סטטי לעמוד-מושג — שובר את קיר-הפרוזה בין הפתיח לגוף ההסבר,
 * ומייצר מקצב של „מושג ⟶ תובנה חזותית ⟶ קריאה מעמיקה”. אינו כלי אינטראקטיבי,
 * אינו CTA, ואינו „קופסה” גנרית: טיפוגרפיה, קווים ומרווח בלבד. כל וריאנט נראה
 * שונה מהאחר (ציטוט / עיקרון / השוואה / הבחנה) כדי שארבעת העמודים לא ייראו זהים.
 * רכיב שרת בלבד — התוכן כולו ב-HTML (crawlable), ללא מצב וללא JS.
 */
export function MethodAnchor({ anchor }: { anchor: MethodAnchorData }) {
  switch (anchor.kind) {
    /* ---- ציטוט-עורך בולט (quiet-check): עיקרון תלוי עם קו-מוביל טרקוטה ---- */
    case "pullquote":
      return (
        <figure className="reveal relative border-s-2 border-brand/45 ps-5 sm:ps-7">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-4 start-3 select-none font-serif text-6xl leading-none text-brand/15 sm:text-7xl"
          >
            „
          </span>
          <blockquote className="relative font-serif text-[clamp(1.4rem,3.2vw,1.95rem)] font-medium leading-[1.4] text-foreground text-balance">
            {anchor.quote}
          </blockquote>
          <figcaption className="mt-3 text-sm font-medium text-foreground-muted">
            {anchor.caption}
          </figcaption>
        </figure>
      );

    /* ---- עיקרון ממוסגר (pace-check): פס עריכתי עם מוטיב-שכבות הולך וגדל ---- */
    case "principle":
      return (
        <aside className="reveal border-y border-border py-8">
          <span className="kicker">{anchor.eyebrow}</span>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
            <span
              aria-hidden="true"
              className="flex shrink-0 flex-col gap-1.5"
            >
              <span className="block h-px w-8 rounded-full bg-border-strong" />
              <span className="block h-px w-12 rounded-full bg-secondary/70" />
              <span className="block h-0.5 w-16 rounded-full bg-brand" />
            </span>
            <p className="font-serif text-[clamp(1.25rem,2.6vw,1.65rem)] font-medium leading-[1.45] text-foreground text-balance">
              {anchor.statement}
            </p>
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
            {anchor.note}
          </p>
        </aside>
      );

    /* ---- השוואה דו-חלקית (eye-level-talk): אותו צורך, „לפני” מול „אחרי” ---- */
    case "contrast":
      return (
        <div className="reveal">
          <span className="kicker">{anchor.eyebrow}</span>
          <div className="mt-5 grid items-start gap-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-7">
            {/* לפני — האשמה, מושתק */}
            <div>
              <span className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
                {anchor.beforeTag}
              </span>
              <div className="mt-3 flex flex-col gap-2.5">
                {anchor.beforeLines.map((line) => (
                  <p
                    key={line}
                    className="font-serif text-[1.05rem] italic leading-relaxed text-foreground-muted [text-wrap:pretty]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* מעבר — חץ (למטה במובייל, הצידה בדסקטופ) */}
            <div
              aria-hidden="true"
              className="flex items-center justify-center text-brand sm:pt-7"
            >
              <ArrowLeft className="h-5 w-5 -rotate-90 sm:rotate-0" />
            </div>

            {/* אחרי — בגובה העיניים, מודגש */}
            <div className="border-t border-border pt-5 sm:border-s sm:border-t-0 sm:ps-7 sm:pt-0">
              <span className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-brand-hover">
                {anchor.afterTag}
              </span>
              <div className="mt-3 flex flex-col gap-2.5">
                {anchor.afterLines.map((line) => (
                  <p
                    key={line}
                    className="font-serif text-[1.08rem] leading-relaxed text-foreground [text-wrap:pretty]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-6 text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
            {anchor.note}
          </p>
        </div>
      );

    /* ---- הבחנה (clean-exit): מה זה *לא* (שלילה מושתקת) מול מה זה *כן* ---- */
    case "distinction":
      return (
        <div className="reveal">
          <span className="kicker">{anchor.eyebrow}</span>
          <p className="mt-4 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
            {anchor.notLabel}
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2.5 p-0">
            {anchor.notItems.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 text-[1.05rem] text-foreground-muted"
              >
                <span aria-hidden="true" className="h-px w-4 bg-border-strong" />
                <span className="line-through decoration-border-strong decoration-1">
                  {item}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-border pt-6 font-serif text-[clamp(1.2rem,2.4vw,1.55rem)] font-medium leading-[1.45] text-foreground text-balance">
            {anchor.statement}
          </p>
        </div>
      );
  }
}
