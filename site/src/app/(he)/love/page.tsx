import { ArrowLeft, Compass } from "lucide-react";

import { pageMetadata } from "@/lib/seo";
import { love } from "@/content/love";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { StationSchema } from "@/components/schema/StationSchema";
import { ViewEvent } from "@/components/analytics/ViewEvent";
import { TrackedInternalLink } from "@/components/analytics/TrackedInternalLink";
import { SectionPoints } from "@/components/pillar/SectionPoints";
import { PillarFaq } from "@/components/pillar/PillarFaq";
import { ComparePair } from "@/components/pillar/ComparePair";
import { PillarSection } from "@/components/pillar/PillarSection";
import { JourneyRail } from "@/components/pillar/JourneyRail";
import { PillarHero } from "@/components/pillar/PillarHero";
import { PillarSignature } from "@/components/pillar/PillarSignature";
import { QuickAnswers } from "@/components/pillar/QuickAnswers";
import { LoveFramework } from "@/components/pillar/LoveFramework";
import { SectionQuestions } from "@/components/pillar/SectionQuestions";
import { PillarStatement } from "@/components/pillar/PillarStatement";
import { PillarPullQuote } from "@/components/pillar/PillarPullQuote";

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

/** המקטע שאחריו מגיע בלוק-ההיפוך הכהה. */
const STATEMENT_AFTER = "healthy-love";

/**
 * הרווח שמעל כל מקטע — לא קבוע, אלא לפי המשקל של מה שנגמר ומה שמתחיל.
 *
 * קודם כל מקטע קיבל אותם 56px, בין אם הוא בן 450px ובין אם הוא בן 1,460px.
 * בדסקטופ זה לא מורגש; במובייל, שבו כל בלוק כזה הוא מסך שלם או שניים, התוצאה
 * היא שהעמוד נקרא בקצב אחיד לגמרי — בלי מקום שבו הוא מאט ובלי מקום שבו הוא
 * נושם. הפונקציה הזאת מחזירה רווח כפול כמעט סביב כל דבר כבד (כרית, כרטיסים,
 * בלוק-ההיפוך), כך שהקצב הוא צפוף → אוויר → הדגשה → אוויר.
 */
function gapBefore(prevId: string | undefined, id: string) {
  const heavy = (x: string | undefined) =>
    x !== undefined && (BAND_SECTIONS.has(x) || CARD_SECTIONS.has(x) || x === STATEMENT_AFTER);
  if (prevId === undefined) return "";
  return heavy(prevId) || heavy(id) ? "mt-20 sm:mt-28" : "mt-14 sm:mt-[4.5rem]";
}

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
        topic="אהבה"
      />

      <Reveal>
        <PillarHero
          tone="settled"
          kicker={love.hero.kicker}
          h1={love.hero.h1}
          lead={love.hero.lead}
          intro={love.hero.intro}
          byline={love.byline}
          shortAnswer={love.shortAnswer}
        />
      </Reveal>

      {/* בקצרה — תווית-שוליים מצד אחד, ומצד שני השאלות כעצירות על מסלול:
          השאלה היא הרגע הטיפוגרפי, והתשובה קטנה מתחתיה. ההיררכיה ההפוכה של
          „שאלות שחוזרות” בהמשך, כדי ששני הבלוקים לא ייקראו כאותו רכיב. */}
      <Reveal className="mt-20 sm:mt-24">
        <QuickAnswers
          title={love.quickAnswers.title}
          items={love.quickAnswers.items}
          tone="settled"
        />
      </Reveal>

      {/* המסגרת מתוך הספר — הנכס שיש סיבה עניינית לצטט אותו.
          ממוקמת מיד אחרי „בקצרה” ולפני הפרקים: הקורא כבר קיבל את התשובה
          הקצרה, וזה הרגע שבו „ואיך זה עובד בפועל” היא השאלה הבאה. */}
      <Reveal className="mt-20 sm:mt-24">
        <LoveFramework />
      </Reveal>

      {/* פרקי-התוכן — כל פרק מקשר אל התשובה המעמיקה */}
      <div className="mt-20 sm:mt-28">
        {love.sections.map((s, i) => (
          <Reveal key={s.id} className={gapBefore(love.sections[i - 1]?.id, s.id)}>
            <PillarSection
              id={s.id}
              heading={s.heading}
              body={s.body}
              marker="rule"
              tone={BAND_SECTIONS.has(s.id) ? "band" : "plain"}
              afterFirstParagraph={
                <>
                  {"questions" in s && s.questions ? <SectionQuestions items={s.questions} /> : null}
                  {"pullQuote" in s && s.pullQuote ? (
                    <PillarPullQuote>{s.pullQuote}</PillarPullQuote>
                  ) : null}
                </>
              }
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
            {/* רגע ההיפוך: אחרי „מה מאפיין אהבה בריאה”, באמצע הרצף, הרקע
                מתהפך לפטרול ומשפט אחד מקבל מסך. זה הניגוד היחיד בעמוד. */}
            {s.id === "healthy-love" ? (
              <div className="pt-16 sm:pt-24">
                <PillarStatement variant="continuing">{love.statement}</PillarStatement>
              </div>
            ) : null}
          </Reveal>
        ))}
      </div>

      {/* שאלות שחוזרות — תוכן גלוי, לא אקורדיון ולא סכימת FAQPage */}
      <Reveal className="mx-auto mt-24 max-w-3xl sm:mt-32">
        <PillarFaq title={love.faq.title} items={love.faq.items} variant="dialogue" />
      </Reveal>

      {/* רגע מעשי אחד — כלי אמיתי מהספר */}
      <Reveal className="-mx-6 mt-20 border-s-2 border-brand bg-surface-muted/60 p-6 sm:mx-auto sm:mt-24 sm:max-w-3xl sm:rounded-3xl sm:p-9">
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

      {/* spokes: תחנות המסע לפי המצב — עצירות על מסלול אחד, לא רשת כרטיסים.
          הכותרת יורדת מהמרכז אל קצה-ההתחלה: היא פותחת את המסלול שמתחילה
          מתחתיה, ולכן היא צריכה לשבת על אותו ציר. ב-/love הנקודות מלאות והקו
          נעצר באחרונה — הגיעו. */}
      <Reveal className="mx-auto mt-20 max-w-3xl sm:mt-24">
        <h2 className="type-section font-serif text-foreground">{love.stations.title}</h2>
        <JourneyRail items={love.stations.items} tone="settled" />
      </Reveal>

      {/* מעבר-הסיום: אחרי התחנות, לפני הסגירה. החתימה חוזרת במלוא גודלה על
          הרקע הפתוח, בלי מסגרת וללא טקסט סביבה — שני הקווים נפגשים, וזה כל
          מה שקורה במסך הזה. היא אינה קישוט בראש כרטיס אלא הרגע שמכריז שהעמוד
          הגיע לסופו, והכרטיס שאחריה הוא כבר המסקנה המעשית. */}
      <Reveal className="mt-28 sm:mt-40">
        <PillarSignature variant="merged" className="mx-auto max-w-[min(360px,74%)]" />
      </Reveal>

      <Reveal className="mx-auto mt-14 max-w-4xl rounded-3xl border border-border bg-surface px-6 py-14 text-center sm:mt-20 sm:px-12 sm:py-20">
        <blockquote className="type-literary mx-auto max-w-[24ch] text-[clamp(1.5rem,3.2vw,2.1rem)] font-medium leading-[1.3] text-foreground">
          {love.close.title}
        </blockquote>
        {love.close.body.map((line, i) => (
          <p
            key={line}
            className={`mx-auto ${i === 0 ? "mt-6" : "mt-3.5"} max-w-[50ch] text-start text-[1.06rem] leading-[1.9] text-foreground-muted`}
          >
            {line}
          </p>
        ))}
        <AmazonBuyLink
          source="book"
          sourceDetail="love"
          className="group mt-12 inline-flex min-h-[60px] items-center justify-center gap-2.5 rounded-full bg-foreground px-10 text-[17.5px] font-semibold tracking-[-0.01em] text-surface transition-[background-color,transform] duration-200 hover:bg-[color:var(--color-petrol)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-brand active:translate-y-px motion-reduce:transition-none sm:mt-14"
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
