import Link from "next/link";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";

import { methodsUi, type Method } from "@/content/methods";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { AskBookLink } from "@/components/journey/AskBookLink";
import { MethodFilterMap } from "@/components/methods/MethodFilterMap";
import { MethodFactStory } from "@/components/methods/MethodFactStory";
import { MethodAnchor } from "@/components/methods/MethodAnchor";
import { SignatureMark } from "@/components/shared/SignatureMark";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { BookLink } from "@/components/shared/BookLink";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { ArticleSchema } from "@/components/schema/ArticleSchema";
import { MethodSchema } from "@/components/schema/MethodSchema";
import { ViewEvent } from "@/components/analytics/ViewEvent";

/**
 * עמוד-מושג (/method/*) — ההגדרה הקנונית של כלי מקורי מהספר. אותם primitives
 * ושפה חזותית של עמודי המדריך: פירורי-לחם, ArticleSchema + Breadcrumb + DefinedTerm,
 * הגדרה קצרה מיד, גוף ההסבר, קישור לכלי בעמוד הספר, מדריכים מיישמים, ו-CTA מרוסן.
 */
export function MethodPage({ method }: { method: Method }) {
  return (
    <Container className="pt-7 pb-10 sm:pt-8 sm:pb-14 lg:pt-10 lg:pb-16">
      {/* מדידה (Phase A) — צפייה במדריך/מושג. משתמש ב-guide_viewed עם ה-slug. */}
      <ViewEvent event="guide_viewed" params={{ guide: method.slug }} />
      <ArticleSchema
        headline={method.h1}
        description={method.metaDescription}
        path={method.path}
        datePublished={method.datePublished}
      />
      <MethodSchema
        name={method.term}
        description={method.definition}
        path={method.path}
      />
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "הספר", path: "/book" },
          { name: method.term, path: method.path },
        ]}
      />

      {/* פירורי לחם — בית → הספר → המושג */}
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
              href="/book"
              className="rounded-sm underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              הספר
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-foreground">
            {method.term}
          </li>
        </ol>
      </nav>

      {/* כותרת + הגדרה קצרה מיד */}
      <header className="enter-stagger mx-auto mt-8 max-w-[62ch]">
        <span className="kicker">{method.kicker}</span>
        <h1 className="mt-5 font-serif type-hero text-foreground">
          {method.h1}
        </h1>
        <p className="mt-6 text-[clamp(1.1rem,1.6vw,1.3rem)] leading-relaxed text-foreground-muted">
          {method.lead}
        </p>
      </header>

      <article className="mx-auto mt-12 flex max-w-[64ch] flex-col gap-12 sm:mt-14">
        {/* פתיח */}
        <section className="reveal flex flex-col gap-4">
          {method.intro.map((p, i) => (
            <p key={i} className="text-[1.075rem] leading-[1.85] text-foreground/90 sm:text-[1.15rem]">
              {p}
            </p>
          ))}
        </section>

        {/* רגע אינטראקטיבי (רק למושג שהרעיון שלו הוא ההשתתפות עצמה). מוקדם בכוונה:
            אחרי מספיק הקשר (Hero + פתיח) אבל *לפני* הפירוק המלא, כדי שהקורא/ת
            ישתתף/תשתתף מתוך האינטואיציה — ולא יקבל/תקבל את התשובות מראש. ההסבר
            המעמיק (שלושת השלבים, הדוגמה מהספר, ה„למה”) בא מיד אחרי.
            „מפת הסינון” לקו-אדום-מול-גמישות; „רגע אחד — שלוש שכבות” לעובדה/סיפור/
            פעולה. לכל היותר אחד מהם קיים למושג נתון. */}
        {method.filterMap ? <MethodFilterMap map={method.filterMap} /> : null}
        {method.factStory ? <MethodFactStory lab={method.factStory} /> : null}
        {/* עוגן חזותי סטטי — לעמודי-המושג שאין להם אינטראקציה. תופס את אותו חריץ
            (אחרי הפתיח, לפני הגוף) כדי לשמור על מקצב זהה לשני העמודים העשירים. */}
        {method.anchor ? <MethodAnchor anchor={method.anchor} /> : null}

        {/* מקטעי גוף — ההסבר המלא (שני הטורים, הטעויות, העיקרון), אחרי השיפוט. */}
        {method.sections.map((section) => (
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
          </section>
        ))}

        {/* הכלי בעמוד הספר (עוגן #tool-<id>) */}
        <p className="reveal rounded-2xl bg-surface-muted p-5 text-[15px] leading-relaxed text-foreground-muted sm:p-6">
          {methodsUi.bookToolLead}{" "}
          <Link
            href={`/book#tool-${method.bookTool.id}`}
            className="font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            „{method.bookTool.name}” בעמוד הספר
          </Link>
          .
        </p>

        {/* הסימן החתום „מחיפוש לבנייה” כמעבר: מהבנת המושג אל הפעולה (הספר).
            מחליף את קו-ההפרדה הרגיל ברגע-מותג שקט אחד לעמוד. */}
        <div className="reveal flex justify-center pt-2" aria-hidden="true">
          <SignatureMark />
        </div>

        {/* כניסה שקטה לעוזר + CTA מרוסן אחד לספר */}
        <section
          aria-labelledby="method-cta-heading"
          className="reveal flex flex-col gap-5 pt-6"
        >
          <h2 id="method-cta-heading" className="sr-only">
            להמשך
          </h2>
          <AskBookLink
            station={method.askStation}
            prompt="רוצים כיוון למצב הספציפי שלכם?"
          />
          <div className="flex flex-col items-start gap-x-8 gap-y-4 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="w-full px-7 sm:w-auto">
              <AmazonBuyLink source="guide" sourceDetail={method.slug}>
                {methodsUi.bookCtaLabel}
              </AmazonBuyLink>
            </Button>
            <BookLink
              href={`/preview?tool=${method.bookTool.id}&station=${method.previewStation}`}
              morphCover
              className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {methodsUi.sampleLabel}
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                aria-hidden="true"
              />
            </BookLink>
          </div>
        </section>
      </article>

      {/* מדריכים שמיישמים את המושג */}
      <section
        aria-labelledby="method-related-heading"
        className="reveal mx-auto mt-16 max-w-[64ch] border-t border-border pt-10"
      >
        <h2
          id="method-related-heading"
          className="font-serif text-xl font-semibold text-foreground"
        >
          {methodsUi.relatedTitle}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {method.relatedGuides.map((rel) => (
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

        {/* חזרה לעמוד הספר — המושג הוא חלק ממנו */}
        <div className="mt-8">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            כל הכלים בעמוד הספר
          </Link>
        </div>
      </section>
    </Container>
  );
}
