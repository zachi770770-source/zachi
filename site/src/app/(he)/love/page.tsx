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
import { ViewEvent } from "@/components/analytics/ViewEvent";
import { TrackedInternalLink } from "@/components/analytics/TrackedInternalLink";
import { ShortAnswer } from "@/components/pillar/ShortAnswer";
import { SectionPoints } from "@/components/pillar/SectionPoints";
import { PillarFaq } from "@/components/pillar/PillarFaq";
import { ComparePair } from "@/components/pillar/ComparePair";
import { PillarSection } from "@/components/pillar/PillarSection";
import { PillarSignature, SignatureMarkRule } from "@/components/pillar/PillarSignature";
import { QuickAnswers } from "@/components/pillar/QuickAnswers";

/**
 * המקטעים שמקבלים פריסת-כרטיסים במקום רשימה.
 *
 * הבחירה היא לפי מזהה-מקטע ולא לפי שדה בתוכן, כדי ש-`love.ts` יישאר תוכן בלבד
 * ולא יחזיק החלטות עיצוב. מקטע אחד בלבד: „איך אהבה נבנית” מונה שלושה דברים
 * נפרדים ושווי-משקל, וזו הצורה שמתאימה להם. יותר מזה היה הופך את העמוד לרשת.
 */
const CARD_SECTIONS = new Set(["how-love-is-built"]);

/**
 * המקטעים שיושבים על כרית חמה. שניים בלבד, ותמיד אלה שיש בהם מבנה: „איך אהבה
 * נבנית” (שלושה כרטיסים) ו„אהבה בזמן קונפליקט” (בלוק-השוואה). התוצאה היא קצב
 * שקט → שקט → הדגשה → שקט → שקט → שקט → הדגשה → שקט → שקט, במקום תשעה מקטעים
 * זהים בזה אחר זה.
 */
const BAND_SECTIONS = new Set(["how-love-is-built", "love-in-conflict"]);

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
    <TrackedInternalLink
      from="love"
      href={href}
      className="group mt-4 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      {label}
      <ArrowLeft
        className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
        aria-hidden="true"
      />
    </TrackedInternalLink>
  );
}

export default function LovePage() {
  return (
    <Container className="pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16">
      <ViewEvent event="love_viewed" />
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

      {/* Hero — כריכה עריכתית. /love מקבל את הדרגה הגדולה (type-hero-lg) וריווח
          נדיב: זה העמוד הרפלקטיבי, והמסך הראשון שלו אמור לנשום. מידת-השורה של
          ה-lead צומצמה ל-52ch — ב-21px, שורה של 60ch ארוכה מדי לקריאה נוחה. */}
      <Reveal className="mx-auto max-w-3xl">
        <BrandMark className="h-10 w-10 text-foreground/80" />
        <span className="kicker mt-6">{love.hero.kicker}</span>
        <h1 className="mt-5 font-serif type-hero-lg text-foreground">{love.hero.h1}</h1>
        {/* חתימת העמוד: שני קווים שנעים זה אל זה. משמשת גם ככלל עריכתי
            בין הכותרת לפתיח, ולכן אינה קישוט שנוסף מהצד. */}
        <PillarSignature variant="merged" className="mt-7 max-w-[min(420px,100%)]" />
        <p className="mt-6 max-w-[50ch] text-[clamp(1.2rem,1.85vw,1.5rem)] leading-[1.6] text-foreground-muted">
          {love.hero.lead}
        </p>
        <p className="mt-5 max-w-[60ch] text-[1.06rem] leading-[1.9] text-foreground">
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
        {/* תשובה ישירה לשאלה הראשית, לפני הגוף: מי שהגיע מחיפוש מקבל תשובה
            מלאה בלי לגלול. */}
        <ShortAnswer label={love.shortAnswer.label} body={love.shortAnswer.body} />
      </Reveal>

      {/* בקצרה — בלוק א-סימטרי רחב: תווית-שוליים מצד אחד, הרשת מהצד השני. */}
      <Reveal className="mt-14 sm:mt-16">
        <QuickAnswers title={love.quickAnswers.title} items={love.quickAnswers.items} />
      </Reveal>

      {/* פרקי-התוכן — כל פרק מקשר אל התשובה המעמיקה */}
      <div className="mt-14 space-y-14 sm:mt-16 sm:space-y-[4.5rem]">
        {love.sections.map((s) => (
          <Reveal key={s.id}>
            <PillarSection
              id={s.id}
              heading={s.heading}
              body={s.body}
              marker="rule"
              tone={BAND_SECTIONS.has(s.id) ? "band" : "plain"}
              footer={<DeepLink href={s.link.href} label={s.link.label} />}
            >
              {"points" in s && s.points ? (
                <SectionPoints
                  points={s.points}
                  variant={CARD_SECTIONS.has(s.id) ? "cards" : "list"}
                />
              ) : null}
              {"compare" in s && s.compare ? (
                <ComparePair
                  lead={s.compare.lead}
                  left={s.compare.left}
                  right={s.compare.right}
                />
              ) : null}
            </PillarSection>
          </Reveal>
        ))}
      </div>

      {/* שאלות שחוזרות — תוכן גלוי, לא אקורדיון ולא סכימת FAQPage */}
      <Reveal className="mx-auto mt-16 max-w-3xl sm:mt-20">
        <PillarFaq title={love.faq.title} items={love.faq.items} />
      </Reveal>

      {/* רגע מעשי אחד — כלי אמיתי מהספר */}
      <Reveal className="-mx-6 mt-14 border-s-2 border-brand bg-surface-muted/60 p-6 sm:mx-auto sm:mt-16 sm:max-w-3xl sm:rounded-3xl sm:p-9">
        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
          <Compass className="h-4 w-4" aria-hidden="true" />
          {love.reflection.kicker}
        </span>
        <h2 className="mt-3.5 font-serif text-[1.45rem] font-semibold text-foreground">
          {love.reflection.title}
        </h2>
        <p className="mt-3.5 max-w-[60ch] text-[1.06rem] leading-[1.9] text-foreground">{love.reflection.body}</p>
        <DeepLink href={love.reflection.link.href} label={love.reflection.link.label} />
      </Reveal>

      {/* spokes: תחנות המסע לפי המצב */}
      <Reveal className="mx-auto mt-16 max-w-3xl sm:mt-20">
        <h2 className="type-section font-serif text-center text-foreground">{love.stations.title}</h2>
        <div className="mt-8 grid items-stretch gap-4 sm:grid-cols-2">
          {love.stations.items.map((st) => (
            <Link
              key={st.href}
              href={st.href}
              className="lift-hover group flex h-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-[22px] hover:border-secondary/35 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-6"
            >
              <span className="font-serif text-[1.05rem] font-semibold text-foreground">
                {st.label}
              </span>
              <ArrowUpLeft
                className="h-5 w-5 shrink-0 text-brand transition-transform group-hover:-translate-x-1.5 group-hover:-translate-y-1 group-focus-visible:-translate-x-1.5 group-focus-visible:-translate-y-1"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </Reveal>

      {/* סגירה: הספר כשיטה המלאה */}
      <Reveal className="mx-auto mt-20 max-w-4xl rounded-3xl border border-border bg-surface px-6 py-14 text-center sm:mt-24 sm:px-12 sm:py-20">
        <SignatureMarkRule align="center" />
        <blockquote className="type-literary mx-auto mt-7 max-w-[24ch] text-[clamp(1.5rem,3.2vw,2.1rem)] font-medium leading-[1.3] text-foreground">
          {love.close.title}
        </blockquote>
        <p className="mx-auto mt-6 max-w-[50ch] text-[1.06rem] leading-[1.9] text-foreground-muted">
          {love.close.body}
        </p>
        <AmazonBuyLink
          source="book"
          sourceDetail="love"
          className="group mt-9 inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-full bg-foreground px-9 text-[17px] font-semibold text-surface transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {love.close.cta}
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
            aria-hidden="true"
          />
        </AmazonBuyLink>
      </Reveal>
    </Container>
  );
}
