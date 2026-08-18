import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Compass } from "lucide-react";

import { pageMetadata } from "@/lib/seo";
import { love } from "@/content/love";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { BrandMark } from "@/components/shared/BrandMark";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { StationSchema } from "@/components/schema/StationSchema";

/**
 * /love — עמוד-הסמכות המרכזי של אשכול „אהבה”. מרכז סמנטי רוחבי (hub) שמקשר
 * אל המדריכים והמושגים המעמיקים (spokes). מרונדר בשרת (טקסט מלא ב-HTML,
 * קישורים ניתנים לזחילה), בשפה העריכתית של האתר. אינו משכפל מדריכים.
 */
export const metadata = pageMetadata({
  title: `${love.meta.title} | מדייטים לאהבה`,
  absoluteTitle: true,
  description: love.meta.description,
  path: "/love",
  ogType: "article",
});

/** קישור-הקשר עריכתי אל התשובה המעמיקה של פרק. */
function DeepLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group mt-4 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      {label}
      <ArrowLeft
        className="h-4 w-4 transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
        aria-hidden="true"
      />
    </Link>
  );
}

export default function LovePage() {
  return (
    <Container className="pt-8 pb-16 sm:pt-10 sm:pb-20 lg:pt-12">
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "אהבה", path: "/love" },
        ]}
      />
      <StationSchema
        name={love.hero.h1}
        description={love.meta.description}
        path="/love"
      />

      {/* Hero */}
      <Reveal className="mx-auto max-w-3xl">
        <BrandMark className="h-9 w-9 text-foreground/80" />
        <span className="kicker mt-5">{love.hero.kicker}</span>
        <h1 className="mt-4 font-serif type-hero text-foreground">{love.hero.h1}</h1>
        <p className="type-lead mt-5 max-w-[60ch] text-foreground-muted">{love.hero.lead}</p>
        <p className="mt-4 max-w-[62ch] text-[1.05rem] leading-relaxed text-foreground">
          {love.hero.intro}
        </p>
        {/* ייחוס נראה: מחבר הספר, עם קישור לעמוד המחבר. בונה אמון (E-E-A-T) בלי
            להמציא תארים. */}
        <p className="mt-5 text-[14px] text-foreground-muted">
          {love.byline.prefix}{" "}
          <Link
            href={love.byline.href}
            className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {love.byline.name}
          </Link>
          , {love.byline.role}
        </p>
      </Reveal>

      {/* בקצרה — תשובות קצרות שאפשר לחלץ */}
      <Reveal className="mx-auto mt-12 max-w-3xl rounded-2xl border border-border bg-surface-muted/50 p-6 sm:p-8">
        <h2 className="text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
          {love.quickAnswers.title}
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          {love.quickAnswers.items.map((item) => (
            <div key={item.q}>
              <dt className="font-serif text-[1.1rem] font-semibold text-foreground">{item.q}</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-foreground-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      {/* פרקי-התוכן — כל פרק מקשר אל התשובה המעמיקה */}
      <div className="mx-auto mt-4 max-w-3xl">
        {love.sections.map((s) => (
          <Reveal
            key={s.id}
            className="border-t border-border py-9 first:border-t-0 sm:py-11"
          >
            <section id={s.id} className="scroll-mt-24">
              <h2 className="type-h2 font-serif text-foreground">{s.heading}</h2>
              {s.body.map((p) => (
                <p key={p} className="mt-4 text-[1.05rem] leading-[1.85] text-foreground">
                  {p}
                </p>
              ))}
              <DeepLink href={s.link.href} label={s.link.label} />
            </section>
          </Reveal>
        ))}
      </div>

      {/* רגע מעשי אחד — כלי אמיתי מהספר */}
      <Reveal className="mx-auto mt-6 max-w-3xl rounded-2xl border-s-2 border-brand bg-surface-muted/60 p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
          <Compass className="h-4 w-4" aria-hidden="true" />
          {love.reflection.kicker}
        </span>
        <h2 className="mt-3 font-serif text-[1.4rem] font-semibold text-foreground">
          {love.reflection.title}
        </h2>
        <p className="mt-3 text-[1.05rem] leading-relaxed text-foreground">{love.reflection.body}</p>
        <DeepLink href={love.reflection.link.href} label={love.reflection.link.label} />
      </Reveal>

      {/* spokes: תחנות המסע לפי המצב */}
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <h2 className="type-h2 font-serif text-center text-foreground">{love.stations.title}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {love.stations.items.map((st) => (
            <Link
              key={st.href}
              href={st.href}
              className="lift-hover group flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5 hover:border-brand/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span className="font-serif text-[1.05rem] font-semibold text-foreground">
                {st.label}
              </span>
              <ArrowUpLeft
                className="h-5 w-5 shrink-0 text-brand transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </Reveal>

      {/* סגירה: הספר כשיטה המלאה */}
      <Reveal className="mx-auto mt-14 max-w-2xl text-center">
        <blockquote className="type-literary text-[clamp(1.35rem,2.8vw,1.8rem)] font-medium leading-snug text-foreground">
          {love.close.title}
        </blockquote>
        <p className="mx-auto mt-5 max-w-[52ch] text-[1.05rem] leading-relaxed text-foreground-muted">
          {love.close.body}
        </p>
        <AmazonBuyLink
          source="book"
          sourceDetail="love"
          className="group mt-7 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-foreground px-7 text-[16px] font-semibold text-surface transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {love.close.cta}
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-1.5"
            aria-hidden="true"
          />
        </AmazonBuyLink>
      </Reveal>
    </Container>
  );
}
