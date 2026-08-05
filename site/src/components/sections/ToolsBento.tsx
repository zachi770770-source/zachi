"use client";

import * as React from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";

import { tools } from "@/content/book";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { BookLink } from "@/components/shared/BookLink";

/**
 * „הכלים המעשיים” — בנטו אינטראקטיבי של ששת הכלים האמיתיים מהספר
 * (src/content/book.ts). כל כלי הוא `<details>` נטיבי: נפתח/נסגר בלחיצה ובמקלדת
 * (Enter/Space), נגיש כברירת מחדל, ועובד גם ללא JS ותחת reduced-motion (הפתיחה
 * מיידית, ללא Flip Cards וללא קרוסלה). לכל כרטיס עוגן יציב `#tool-<id>` כדי
 * שתוצאת ה-Path Finder תוכל להגיע אליו ישירות, לפתוח אותו ולהעביר אליו focus.
 * מבנה בנטו: שני כלים „מובילים” רחבים (הראשון והאחרון) וארבעה רגילים; טור יחיד
 * במובייל, שתיים/ארבע עמודות בדסקטופ. תוכן: שם + הסבר קצר מהספר בלבד (אין תוכן
 * מומצא). שפת Ink/Ivory/Sage/Terracotta הקיימת.
 */
export function ToolsBento({ hideCta = false }: { hideCta?: boolean } = {}) {
  const items = tools.items.slice(0, 6);
  const feature = new Set([0, items.length - 1]);

  // deep-link: ‏#tool-<id> פותח את הכרטיס, גולל אליו (מיידית, בלי לשבור smooth
  // גלובלי) ומעביר focus ל-summary — נגיש. רץ בטעינה ובכל שינוי hash.
  React.useEffect(() => {
    const openFromHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#tool-")) return;
      const el = document.getElementById(hash.slice(1));
      if (!(el instanceof HTMLDetailsElement)) return;
      el.open = true;
      // focus קודם (בלי לגלול) כדי שהוא לא ידרוס את מיקום ה-scroll-mt; אחר-כך
      // גלילה מיידית שמכבדת את scroll-mt-24 (הכרטיס יושב מתחת ל-header הדביק).
      el.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      el.scrollIntoView({ block: "start" });
      // תיקון-מסגרת: פתיחת כרטיס גבוה משנה גובה-שורה בגריד, ובמכשירים איטיים
      // (או כשהפריסה עדיין מתייצבת) הגלילה הראשונה עלולה לנחות על מיקום ישן.
      // גלילה חוזרת ב-rAF, אחרי שהפריסה סופית, מבטיחה שהכרטיס יושב בראש — ורק
      // אז משחזרים את התנהגות-הגלילה החלקה.
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: "start" });
        html.style.scrollBehavior = prev;
      });
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return (
    <section
      id="tools"
      className="scroll-mt-20 py-16 sm:py-20"
      aria-labelledby="tools-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">כלים, לא רק רעיון</span>
          <h2 id="tools-heading" className="type-h2 mt-4">
            {tools.title}
          </h2>
          <p className="type-lead mt-4 text-foreground-muted">{tools.description}</p>
          <p className="mt-2 text-[14px] text-foreground-muted">
            לחצו על כל כלי כדי לפתוח אותו.
          </p>
        </Reveal>

        <Reveal className="mx-auto mt-10 grid max-w-5xl gap-3.5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((tool, i) => {
            const wide = feature.has(i);
            return (
              <details
                key={tool.id}
                id={`tool-${tool.id}`}
                className={`tool-acc group scroll-mt-24 rounded-2xl border transition-colors duration-200 ${
                  wide
                    ? "border-secondary/40 bg-secondary-muted/60 open:border-secondary/60 sm:col-span-2"
                    : "border-border bg-surface open:border-brand/40"
                }`}
              >
                <summary className="tool-acc__summary flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-6">
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-muted font-quote text-[14px] font-bold tabular-nums text-brand-hover"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-serif font-semibold leading-snug text-foreground ${
                        wide ? "text-[1.3rem]" : "text-[1.12rem]"
                      }`}
                    >
                      {tool.name}
                    </span>
                  </span>
                  <ChevronDown
                    className="tool-acc__chev h-5 w-5 shrink-0 text-foreground-muted transition-transform duration-200"
                    aria-hidden="true"
                  />
                </summary>
                <div className="tool-acc__body px-5 pb-5 sm:px-6 sm:pb-6">
                  <p className="tool-acc__desc text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                    {tool.description}
                  </p>

                  {/* העשרה מכתב-היד — ציטוט ישיר בלבד (ראו book.ts). מופיעה רק
                      בפתיחת הכרטיס (Progressive Disclosure), ורק לכלים שיש להם
                      מקור מאומת בספר; לכלי בלי מקור לא מוצג דבר. */}
                  {(tool.whenToUse ||
                    tool.howItWorks ||
                    tool.example ||
                    tool.exercise ||
                    tool.quote) && (
                    <dl className="mt-4 space-y-3 border-t border-border pt-4">
                      {tool.whenToUse && (
                        <div>
                          <dt className="text-[12px] font-semibold uppercase tracking-wide text-brand-hover">
                            מתי זה מתאים
                          </dt>
                          <dd className="mt-1 text-[14px] leading-relaxed text-foreground [text-wrap:pretty]">
                            {tool.whenToUse}
                          </dd>
                        </div>
                      )}
                      {tool.howItWorks && (
                        <div>
                          <dt className="text-[12px] font-semibold uppercase tracking-wide text-brand-hover">
                            איך זה עובד
                          </dt>
                          <dd className="mt-1 text-[14px] leading-relaxed text-foreground [text-wrap:pretty]">
                            {tool.howItWorks}
                          </dd>
                        </div>
                      )}
                      {tool.example && (
                        <div>
                          <dt className="text-[12px] font-semibold uppercase tracking-wide text-brand-hover">
                            דוגמה מהספר
                          </dt>
                          <dd className="mt-1 text-[14px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                            {tool.example}
                          </dd>
                        </div>
                      )}
                      {tool.exercise && (
                        <div>
                          <dt className="text-[12px] font-semibold uppercase tracking-wide text-brand-hover">
                            תרגיל קצר
                          </dt>
                          <dd className="mt-1 text-[14px] leading-relaxed text-foreground [text-wrap:pretty]">
                            {tool.exercise}
                          </dd>
                        </div>
                      )}
                      {tool.quote && (
                        <blockquote className="border-s-2 border-secondary ps-3 font-serif text-[15px] italic leading-relaxed text-foreground [text-wrap:pretty]">
                          {tool.quote}
                        </blockquote>
                      )}
                    </dl>
                  )}

                  {/* נגן שמע אופציונלי — מוצג אך ורק כשקיימים גם קובץ מאושר וגם
                      תמלול. אין אוטו-פליי; preload="none" מבטיח שהקובץ נטען רק
                      כשהמשתמש מנגן (הכרטיס ממילא סגור עד לפתיחה). כרגע אין הקלטות
                      מאושרות, ולכן החסימה הזו לא מרנדרת דבר. */}
                  {tool.audioSrc && tool.audioTranscript ? (
                    <div className="mt-4">
                      <audio
                        controls
                        preload="none"
                        className="w-full"
                        aria-label={`הקראה קצרה: ${tool.name}`}
                      >
                        <source src={tool.audioSrc} />
                      </audio>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[13px] font-medium text-brand-hover underline-offset-4 hover:underline">
                          תמלול ההקלטה
                        </summary>
                        <p className="mt-2 text-[14px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                          {tool.audioTranscript}
                        </p>
                      </details>
                    </div>
                  ) : null}
                </div>
              </details>
            );
          })}
        </Reveal>

        {!hideCta && (
          <Reveal className="mt-9 flex justify-center">
            <Button asChild size="lg" variant="outline">
              <BookLink href="/book">
                לשיטה ולכלים המלאים בספר
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </BookLink>
            </Button>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
