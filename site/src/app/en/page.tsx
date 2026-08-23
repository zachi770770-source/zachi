import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { en } from "@/content/en";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { BrandMark } from "@/components/shared/BrandMark";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { EnglishEditionSchema } from "@/components/schema/EnglishEditionSchema";

const edition = siteConfig.englishEdition;

export const metadata = pageMetadata({
  title: en.meta.title,
  description: en.meta.description,
  path: "/en",
  absoluteTitle: true,
  ogType: "article",
  ogLocale: "en_US",
  siteName: edition.title,
  // הדדי מול עמוד הבית העברי. אותה מפה בדיוק מוצהרת גם שם.
  languages: { he: "/", en: "/en", "x-default": "/" },
});

/**
 * /en — עמוד הנחיתה של המהדורה האנגלית.
 *
 * שלוש הערות ארכיטקטורה:
 *
 * 1. **`lang`/`dir` על העטיפה, לא על `<html>`.** ב-App Router רק ה-root
 *    layout מגדיר `<html>`, ולהחלפת `lang` לפי מסלול צריך או סגמנט `[lang]`
 *    או שני root layouts בקבוצות-מסלול — ושניהם דורשים להזיז את *כל* מסלולי
 *    האתר העברי, כולל sitemap/robots/not-found. זה בדיוק המשטח שאסור לזעזע.
 *    `lang`/`dir` הם תכונות גלובליות, וההגדרה הקרובה ביותר גוברת על תת-העץ,
 *    ולכן התוכן האנגלי מסומן נכון. ראו את הדיווח לגבי ההשלכה היחידה שנשארת.
 *
 * 2. **אין הפניה אוטומטית.** „/” ו„/en” שתיהן כתובות ישירות, יציבות, כל אחת
 *    canonical לעצמה, ומקושרות הדדית ב-hreflang. אין תלות ב-Accept-Language.
 *
 * 3. **יעד רכישה יחיד.** כל CTA כאן מצביע ל-`englishEdition.url` בלבד. אסור
 *    שקישור למהדורה העברית (ASIN אחר) יופיע בעמוד הזה.
 */
export default function EnglishPage() {
  return (
    <div lang="en" dir="ltr" className="text-start">
      <EnglishEditionSchema />

      <Container className="pt-8 pb-16 sm:pt-10 sm:pb-20 lg:pt-12">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <Reveal className="mx-auto max-w-3xl">
          <BrandMark className="h-9 w-9 text-foreground/80" />
          <span className="kicker mt-5">{en.hero.kicker}</span>

          <h1 className="mt-4 font-serif type-hero text-foreground">{en.hero.title}</h1>
          <p className="mt-3 max-w-[52ch] font-serif text-[1.25rem] leading-snug text-foreground-muted">
            {en.hero.subtitle}
          </p>

          <p className="mt-4 text-[1.05rem] font-medium text-foreground">
            {en.hero.byline}
            <span aria-hidden="true" className="mx-2 text-border-strong">
              ·
            </span>
            <span className="font-normal text-foreground-muted">{en.hero.availability}</span>
          </p>

          <p className="type-lead mt-6 max-w-[60ch] text-foreground-muted">{en.hero.lead}</p>
          <p className="mt-4 max-w-[62ch] text-[1.05rem] leading-relaxed text-foreground">
            {en.hero.intro}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href={edition.url} target="_blank" rel="noopener noreferrer">
                {edition.buyLabel}
              </a>
            </Button>
            <LanguageSwitch to="he" />
          </div>
        </Reveal>

        {/* ── What the book is about ───────────────────────────────────── */}
        <Reveal className="mx-auto mt-16 max-w-3xl sm:mt-20">
          <h2 className="type-h2 font-serif text-foreground">{en.about.title}</h2>
          {en.about.body.map((p) => (
            <p key={p} className="mt-4 max-w-[62ch] text-[1.05rem] leading-relaxed text-foreground-muted">
              {p}
            </p>
          ))}
        </Reveal>

        {/* ── Who this book is for ─────────────────────────────────────── */}
        <Reveal className="mx-auto mt-16 max-w-3xl sm:mt-20">
          <h2 className="type-h2 font-serif text-foreground">{en.audience.title}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {en.audience.items.map((item) => (
              <li key={item.title} className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="font-serif text-[1.1rem] font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-[0.97rem] leading-relaxed text-foreground-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* ── What the book works on ───────────────────────────────────── */}
        <Reveal className="mx-auto mt-16 max-w-3xl sm:mt-20">
          <h2 className="type-h2 font-serif text-foreground">{en.themes.title}</h2>
          <ul className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {en.themes.items.map((item) => (
              <li key={item.title}>
                <h3 className="font-serif text-[1.1rem] font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-[0.97rem] leading-relaxed text-foreground-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* ── About the author ─────────────────────────────────────────── */}
        <Reveal className="mx-auto mt-16 max-w-3xl sm:mt-20">
          <h2 className="type-h2 font-serif text-foreground">{en.author.title}</h2>
          {en.author.body.map((p) => (
            <p key={p} className="mt-4 max-w-[62ch] text-[1.05rem] leading-relaxed text-foreground-muted">
              {p}
            </p>
          ))}
          <p className="mt-5">
            <Link
              href="/"
              hrefLang="he"
              className="inline-flex items-center gap-1.5 text-[0.97rem] font-medium text-foreground underline underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {en.author.hebrewSiteLabel}
            </Link>
          </p>
        </Reveal>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <Reveal className="mx-auto mt-16 max-w-3xl sm:mt-20">
          <div className="rounded-2xl border border-border bg-surface-muted p-7 sm:p-9">
            <h2 className="type-h2 font-serif text-foreground">{en.cta.title}</h2>
            <p className="mt-3 max-w-[56ch] text-[1.05rem] leading-relaxed text-foreground-muted">
              {en.cta.body}
            </p>
            <div className="mt-6">
              <Button asChild size="lg">
                <a href={edition.url} target="_blank" rel="noopener noreferrer">
                  {en.cta.button}
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
