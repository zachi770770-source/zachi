import Link from "next/link";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";

import { pageMetadata } from "@/lib/seo";
import { guides } from "@/content/guides";
import {
  guideIndexMeta,
  guideStages,
  journey,
  journeyMeta,
} from "@/content/guideIndex";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { BrandMark } from "@/components/shared/BrandMark";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { StationSchema } from "@/components/schema/StationSchema";
import { ViewEvent } from "@/components/analytics/ViewEvent";
import { JourneySpine } from "@/components/pillar/JourneySpine";
import { TrackedInternalLink } from "@/components/analytics/TrackedInternalLink";

/**
 * /guide — אינדקס המדריכים.
 *
 * לא מפת-אתר בתחפושת: המדריכים מסודרים לפי שלבי המסע, וכל שלב נפתח במשפט
 * שמסביר מתי הוא רלוונטי, כדי שאפשר יהיה למצוא לפי מצב ולא לפי כותרת. מרונדר
 * בשרת במלואו — כל הכותרות והקישורים ב-HTML, בלי תלות ב-JS.
 */
export const metadata = pageMetadata({
  title: `${guideIndexMeta.title} | מדייטים לאהבה`,
  absoluteTitle: true,
  description: guideIndexMeta.description,
  path: "/guide",
});

export default function GuideIndexPage() {
  return (
    <Container className="pt-8 pb-16 sm:pt-10 sm:pb-20 lg:pt-12">
      <ViewEvent event="guide_index_viewed" />
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "מדריכים", path: "/guide" },
        ]}
      />
      <StationSchema
        name={guideIndexMeta.h1}
        description={guideIndexMeta.description}
        path="/guide"
      />

      <Reveal className="mx-auto max-w-3xl">
        <BrandMark className="h-9 w-9 text-foreground/80" />
        <span className="kicker mt-5">{guideIndexMeta.kicker}</span>
        <h1 className="mt-4 font-serif type-hero text-foreground">{guideIndexMeta.h1}</h1>
        <p className="type-lead mt-5 max-w-[60ch] text-foreground-muted">
          {guideIndexMeta.lead}
        </p>
        <p className="mt-5 text-[14px] text-foreground-muted">
          {guideIndexMeta.byline.prefix}{" "}
          <Link
            href={guideIndexMeta.byline.href}
            className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {guideIndexMeta.byline.name}
          </Link>
          , {guideIndexMeta.byline.role}
        </p>
      </Reveal>

      {/* ציר-המסע: הנכס העריכתי של העמוד. מאפשר לקורא שנחת ישירות מגוגל לזהות
          איפה הוא נמצא ולצאת עם כיוון, לפני שהוא מגיע לספרייה עצמה. */}
      <Reveal className="mx-auto mt-12 max-w-3xl border-t border-border pt-10">
        <JourneySpine
          title={journeyMeta.title}
          lead={journeyMeta.lead}
          stations={journey}
          aside={journeyMeta.aside}
          asideLink={journeyMeta.asideLink}
        />
      </Reveal>

      <div className="mx-auto mt-4 max-w-3xl">
        {guideStages.map((stage) => (
          <Reveal
            key={stage.id}
            className="border-t border-border py-9 first:border-t-0 sm:py-11"
          >
            <section id={stage.id} className="scroll-mt-24">
              <h2 className="type-h2 font-serif text-foreground">{stage.title}</h2>
              <p className="mt-3 max-w-[60ch] text-[1.05rem] leading-relaxed text-foreground-muted">
                {stage.lead}
              </p>
              {stage.hub ? (
                <Link
                  href={stage.hub.href}
                  className="group mt-4 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  {stage.hub.label}
                  <ArrowLeft
                    className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                    aria-hidden="true"
                  />
                </Link>
              ) : null}

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {stage.slugs.map((slug) => {
                  const guide = guides[slug];
                  if (!guide) return null;
                  // המדריך המומלץ להתחלה מסומן ויזואלית ובטקסט. בלי הסימון, שש
                  // כותרות דומות משאירות את הקורא לבחור באקראי.
                  const isStart = stage.startWith === slug;
                  return (
                    <li key={slug}>
                      <TrackedInternalLink
                        from="guide"
                        href={guide.path}
                        className={`lift-hover group flex h-full items-start justify-between gap-3 rounded-2xl border bg-surface p-5 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                          isStart
                            ? "border-brand/40 hover:border-brand/60"
                            : "border-border hover:border-secondary/35"
                        }`}
                      >
                        <span className="font-serif text-[1.02rem] font-semibold leading-snug text-foreground">
                          {isStart ? (
                            <span className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wide text-brand-hover">
                              מומלץ להתחיל כאן
                            </span>
                          ) : null}
                          {guide.h1}
                        </span>
                        <ArrowUpLeft
                          className="mt-0.5 h-5 w-5 shrink-0 text-brand transition-transform group-hover:-translate-x-1.5 group-hover:-translate-y-1 group-focus-visible:-translate-x-1.5 group-focus-visible:-translate-y-1"
                          aria-hidden="true"
                        />
                      </TrackedInternalLink>
                    </li>
                  );
                })}
              </ul>
            </section>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-14 max-w-2xl text-center">
        <blockquote className="type-literary text-[clamp(1.35rem,2.8vw,1.8rem)] font-medium leading-snug text-foreground">
          {guideIndexMeta.close.title}
        </blockquote>
        <p className="mx-auto mt-5 max-w-[52ch] text-[1.05rem] leading-relaxed text-foreground-muted">
          {guideIndexMeta.close.body}
        </p>
        <Link
          href={guideIndexMeta.close.href}
          className="group mt-7 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-foreground px-7 text-[16px] font-semibold text-surface transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {guideIndexMeta.close.cta}
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
            aria-hidden="true"
          />
        </Link>
        <p className="mt-6">
          <Link
            href={guideIndexMeta.close.secondary.href}
            className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {guideIndexMeta.close.secondary.label}
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
              aria-hidden="true"
            />
          </Link>
        </p>
      </Reveal>
    </Container>
  );
}
