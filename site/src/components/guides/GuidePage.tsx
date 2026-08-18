import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Info } from "lucide-react";

import { guidesUi, type Guide } from "@/content/guides";
import { cn } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { AskBookLink } from "@/components/journey/AskBookLink";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { BookLink } from "@/components/shared/BookLink";
import { SignatureMark } from "@/components/shared/SignatureMark";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { ArticleSchema } from "@/components/schema/ArticleSchema";
import { ViewEvent } from "@/components/analytics/ViewEvent";

/**
 * רכיב משותף למאמרי המדריך (אשכול „לפני קשר”). מרנדר מאמר מלא בשפה החזותית
 * של האתר: פירורי-לחם, Article + Breadcrumb schema, כותרת + תשובה קצרה, גוף
 * לפי כוונת-החיפוש, כלי מהספר, קישורים פנימיים לעמוד-האם ולמאמרים הקרובים,
 * כניסה לעוזר, ו-CTA מרוסן אחד לספר/אמזון. אין רידיזיין — אותם primitives.
 */
export function GuidePage({ guide }: { guide: Guide }) {
  // deep-link לטעימה: כשלמדריך יש כלי-ספר מאומת, הטעימה נפתחת ישירות על הכלי
  // ובהקשר התחנה (ה-hub). ה-station נגזר מ-hub.href (תמיד מפתח תקף ב-stations),
  // וה-tool מ-bookTool.id (תמיד מזהה כלי אמיתי). אחרת — הטעימה הכללית.
  const samplePreviewHref = guide.bookTool
    ? `/preview?tool=${guide.bookTool.id}&station=${guide.hub.href.slice(1)}`
    : "/preview";
  return (
    <Container className="pt-7 pb-10 sm:pt-8 sm:pb-14 lg:pt-10 lg:pb-16">
      {/* מדידה (Phase A) — צפייה במדריך, פעם אחת, עם זהות המדריך (slug). */}
      <ViewEvent event="guide_viewed" params={{ guide: guide.slug }} />
      <ArticleSchema
        headline={guide.h1}
        description={guide.metaDescription}
        path={guide.path}
        datePublished={guide.datePublished}
      />
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: guide.hub.label, path: guide.hub.href },
          { name: guide.h1, path: guide.path },
        ]}
      />

      {/* פירורי לחם נגישים — בית → עמוד-האם → המאמר */}
      <nav aria-label="פירורי לחם" className="text-sm text-foreground-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href="/"
              className="rounded-sm underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              בית
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={guide.hub.href}
              className="rounded-sm underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {guide.hub.label}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-foreground">
            {guide.metaTitle}
          </li>
        </ol>
      </nav>

      {/* כותרת + תשובה קצרה מיד (עונה על השאלה מוקדם) */}
      <header className="enter-stagger mx-auto mt-8 max-w-[62ch]">
        <span className="kicker">{guide.kicker}</span>
        <h1 className="mt-5 font-serif type-hero text-foreground">
          {guide.h1}
        </h1>
        <p className="mt-6 text-[clamp(1.1rem,1.6vw,1.3rem)] leading-relaxed text-foreground-muted">
          {guide.lead}
        </p>
      </header>

      <article className="mx-auto mt-12 flex max-w-[64ch] flex-col gap-12 sm:mt-14">
        {/* פתיח */}
        <section className="reveal flex flex-col gap-4">
          {guide.intro.map((p, i) => (
            <p
              key={i}
              className={cn(
                "text-[1.075rem] leading-[1.85] text-foreground/90 sm:text-[1.15rem]",
                // הפסקה הפותחת של הגוף היא המסגור האנושי לפני ההסבר — משקל-lead
                // חמים (כמו בעמודי-המסע), כדי שהמדריך „ידבר” לפני שהוא מסביר.
                i === 0 &&
                  "text-[clamp(1.2rem,1.7vw,1.4rem)] font-medium leading-[1.6] text-foreground sm:text-[clamp(1.2rem,1.7vw,1.4rem)]",
              )}
            >
              {p}
            </p>
          ))}
          {guide.disclaimer ? (
            <p className="mt-2 flex items-start gap-2.5 rounded-2xl bg-surface-muted p-4 text-[15px] leading-relaxed text-foreground-muted">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              <span>{guide.disclaimer}</span>
            </p>
          ) : null}
        </section>

        {/* מקטעי גוף — H2 + פסקאות (+ H3 אופציונלי) */}
        {guide.sections.map((section) => (
          <section key={section.heading} className="reveal">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              {section.heading}
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-[1.075rem] leading-[1.85] text-foreground/90 sm:text-[1.15rem]">
                  {p}
                </p>
              ))}
            </div>
            {section.points ? (
              <ul className="mt-5 flex flex-col gap-4">
                {section.points.map((pt) => (
                  <li
                    key={pt.title}
                    className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
                  >
                    <h3 className="font-serif text-[1.3rem] font-semibold leading-snug text-foreground">
                      {pt.title}
                    </h3>
                    <p className="mt-2 text-[16px] leading-relaxed text-foreground-muted">
                      {pt.body}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {/* כלי מהספר */}
        {guide.framework ? (
          <section className="reveal rounded-2xl border border-border bg-surface-muted p-6 sm:p-8">
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
              {guide.framework.kicker}
            </p>
            <h2 className="mt-2 font-serif text-xl font-semibold text-foreground">
              {guide.framework.title}
            </h2>
            {guide.framework.intro ? (
              <p className="mt-3 text-[1.02rem] leading-relaxed text-foreground/90">
                {guide.framework.intro}
              </p>
            ) : null}
            <ol className="mt-4 flex flex-col gap-3">
              {guide.framework.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-brand-foreground tabular-nums"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span className="text-[1.02rem] leading-relaxed text-foreground/90">
                    {item}
                  </span>
                </li>
              ))}
            </ol>
            {guide.framework.note ? (
              <p className="mt-5 border-e-2 border-brand pe-4 text-[15px] italic leading-relaxed text-foreground-muted">
                {guide.framework.note}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* קישור פנימי לכלי המאומת בעמוד הספר (עוגן #tool-<id>) */}
        {guide.bookTool ? (
          <p className="reveal text-[15px] leading-relaxed text-foreground-muted">
            הכלי הזה מופיע בהרחבה בספר:{" "}
            <Link
              href={`/book#tool-${guide.bookTool.id}`}
              className="font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              „{guide.bookTool.name}” בעמוד הספר
            </Link>
            .
          </p>
        ) : null}

        {/* „על מה שווה לשים לב עכשיו” — מסקנה עריכתית שקטה של משפט אחד, רק
            במדריכים שבהם היא באמת מוסיפה (אי-ודאות / חזרה לאקס). גיבוש של מה
            שכבר נאמר בגוף המדריך; לא כרטיס, לא אייקון, לא חזק מהתוכן. */}
        {guide.attention ? (
          <div className="reveal border-t border-border pt-6">
            <p className="kicker">על מה שווה לשים לב עכשיו</p>
            <p className="mt-2 text-[1.05rem] leading-relaxed text-foreground/90 [text-wrap:pretty]">
              {guide.attention}
            </p>
          </div>
        ) : null}

        {/* הסימן החתום „מחיפוש לבנייה” כמעבר אל הפעולה, זהה לעמודי-המושג
            (/method/*), כדי שהתאומים העריכתיים יתנהגו אותו דבר וגם המדריך
            יורגש כחלק ממערכת-הספר ולא כמאמר גנרי. */}
        <div className="reveal flex justify-center pt-2" aria-hidden="true">
          <SignatureMark />
        </div>

        {/* כניסה שקטה לעוזר + CTA מרוסן אחד לספר */}
        <section
          aria-labelledby="guide-cta-heading"
          className="reveal flex flex-col gap-5 pt-6"
        >
          <h2 id="guide-cta-heading" className="sr-only">
            להמשך
          </h2>
          <AskBookLink
            station={guide.askStation}
            prompt="רוצים כיוון למצב הספציפי שלכם?"
          />
          <div className="flex flex-col items-start gap-x-8 gap-y-4 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="w-full px-7 sm:w-auto">
              <AmazonBuyLink source="guide" sourceDetail={guide.slug}>
                {guidesUi.bookCtaLabel}
              </AmazonBuyLink>
            </Button>
            <BookLink
              href={samplePreviewHref}
              morphCover
              className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {guidesUi.sampleLabel}
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                aria-hidden="true"
              />
            </BookLink>
          </div>
        </section>
      </article>

      {/* מאמרים קרובים באשכול + עמוד-האם */}
      <section
        aria-labelledby="guide-related-heading"
        className="reveal mx-auto mt-16 max-w-[64ch] border-t border-border pt-10"
      >
        <h2
          id="guide-related-heading"
          className="font-serif text-xl font-semibold text-foreground"
        >
          {guidesUi.relatedTitle}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {guide.related.map((rel) => (
            <Link
              key={rel.href}
              href={rel.href}
              className="lift-hover group flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5 hover:border-brand/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <div>
                <span className="font-serif text-[1.05rem] font-semibold leading-tight text-foreground">
                  {rel.label}
                </span>
                {rel.sub ? (
                  <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                    {rel.sub}
                  </p>
                ) : null}
              </div>
              <ArrowUpLeft
                className="h-5 w-5 shrink-0 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5 group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>

        {/* קישור לעמוד-המושג המקורי (/method/*) — רק כשקיים */}
        {guide.method ? (
          <Link
            href={guide.method.href}
            className="lift-hover group mt-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-brand/40 bg-surface p-5 hover:border-brand/60 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <div>
              <span className="text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
                מושג מהספר
              </span>
              <span className="mt-1 block font-serif text-[1.05rem] font-semibold leading-tight text-foreground">
                {guide.method.label}
              </span>
              {guide.method.sub ? (
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  {guide.method.sub}
                </p>
              ) : null}
            </div>
            <ArrowUpLeft
              className="h-5 w-5 shrink-0 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5 group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5"
              aria-hidden="true"
            />
          </Link>
        ) : null}

        {/* קישור-הקשר משני (למשל בתוך קשר / בניית קשר) — רק כשקיים */}
        {guide.secondary ? (
          <Link
            href={guide.secondary.href}
            className="lift-hover group mt-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-surface p-5 hover:border-brand/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <div>
              <span className="font-serif text-[1.05rem] font-semibold text-foreground">
                {guide.secondary.label}
              </span>
              {guide.secondary.sub ? (
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  {guide.secondary.sub}
                </p>
              ) : null}
            </div>
            <ArrowUpLeft
              className="h-5 w-5 shrink-0 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5 group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5"
              aria-hidden="true"
            />
          </Link>
        ) : null}

        {/* עמוד-האם של האשכול */}
        <div className="mt-8">
          <Link
            href={guide.hub.href}
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {guidesUi.hubTitle}: {guide.hub.label}
          </Link>
        </div>

        {/* קישור אל מרכז-האשכול הרוחבי „אהבה” — התמונה המושגית הרחבה שמעל המדריך. */}
        <div className="mt-3">
          <Link
            href="/love"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            התמונה הרחבה: מהי אהבה ואיך היא נבנית
          </Link>
        </div>
      </section>
    </Container>
  );
}
