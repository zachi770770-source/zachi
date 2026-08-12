import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

import { stations } from "@/content/stations";
import { guideOrder, guides } from "@/content/guides";
import type {
  JourneyId,
  JourneyPage as JourneyPageData,
  JourneyVariant,
} from "@/content/journeyPages";
import { cn } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { BookLink } from "@/components/shared/BookLink";
import { AmazonBuyLink, type AmazonSource } from "@/components/purchase/AmazonBuyLink";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { StationSchema } from "@/components/schema/StationSchema";
import { JourneyView } from "@/components/journey/JourneyView";
import { AskBookLink } from "@/components/journey/AskBookLink";
import { askBook } from "@/content/compass";

/**
 * עמוד-מסע אישי (Landing) לאחת מארבע הבחירות ב-Home — נכתב לשפת-המצב של הקורא,
 * לא כרטיס-ניווט מוגדל. מבנה עריכתי אחיד A–J, אבל *לא* Template משוכפל: לכל מסלול
 * `variant` (clarity/movement/depth/space) שמשנה בעדינות את הרכב ה-Hero, מיקום
 * ציטוט-העצירה, פריסת שלוש נקודות-העומק והקצב האנכי — בלי לשבור את שפת המותג.
 *
 * המבנה: A. Hero דו-טורי · B. „מה באמת קורה” (שיקוף) · C. שלוש נקודות-עומק
 * ממוספרות · D. Moment of recognition (ציטוט גדול) · E. „מה הספר יעזור לראות” ·
 * F. משפט-מעבר · G. טעימה מותאמת (פעולה ראשית) · H. „שאל את הספר” (משני, עם
 * הקשר-המצב) · I. Next step (רך, שונה לפי מסלול) · J. קישור שקט „מסלול אחר”.
 *
 * הטעימה עצמה אמיתית ומגיעה מ-/preview?tool=&station= (תוכן כלי מאושר). אין כאן
 * בורר ארבעת-המצבים מחדש — רק קישור שקט חזרה אליו.
 */

type VariantConfig = {
  /** הרכב ה-Hero: מפוצל דו-טורי מול ריכוזי-אוורירי. */
  hero: "split" | "centered";
  /** באיזה צד יושבת אמירת-מצב-הרוח ב-Hero המפוצל. */
  moodSide: "start" | "end";
  /** היכן ציטוט-העצירה נופל בזרימה — פסק אחרי השיקוף, או שיא אחרי נקודות-העומק. */
  quoteAfter: "reflection" | "points";
  /** אופי ציטוט-העצירה: פס-רקע מלא מול ציטוט חשוף בין קווי-שׂיא. */
  quoteTone: "band" | "rule";
  /** פריסת שלוש נקודות-העומק בדסקטופ: טור-שלישיות מול שורות שכבתיות. */
  points: "grid" | "rows";
  /** קצב אנכי בין הפסים. */
  rhythm: string;
};

const VARIANTS: Record<JourneyVariant, VariantConfig> = {
  // לפני קשר — בהירות: פיצול רגוע, אמירה בצד-הסיום, פסק שקט לפני נקודות-העומק.
  clarity: {
    hero: "split",
    moodSide: "end",
    quoteAfter: "reflection",
    quoteTone: "rule",
    points: "grid",
    rhythm: "space-y-16 sm:space-y-20 lg:space-y-24",
  },
  // מתחילים קשר — תנועה: הפיצול מתהפך, והציטוט הוא שיא-מומנטום אחרי נקודות-העומק.
  movement: {
    hero: "split",
    moodSide: "start",
    quoteAfter: "points",
    quoteTone: "band",
    points: "grid",
    rhythm: "space-y-14 sm:space-y-16 lg:space-y-20",
  },
  // בתוך קשר — עומק: שורות שכבתיות במקום טור, וציטוט-שיא מלא אחרי נקודות-העומק.
  depth: {
    hero: "split",
    moodSide: "end",
    quoteAfter: "points",
    quoteTone: "band",
    points: "rows",
    rhythm: "space-y-14 sm:space-y-16 lg:space-y-[4.5rem]",
  },
  // אחרי פרידה — מרחב: Hero ריכוזי אוורירי, וציטוט חשוף מבודד עוד לפני העומק.
  space: {
    hero: "centered",
    moodSide: "end",
    quoteAfter: "reflection",
    quoteTone: "rule",
    points: "grid",
    rhythm: "space-y-16 sm:space-y-24 lg:space-y-28",
  },
};

/** מקור אנונימי לאירוע רכישת אמזון — מזהה תחנה בלבד, ללא PII. */
const AMAZON_SOURCE: Record<JourneyId, AmazonSource> = {
  "before-relationship": "journey_before",
  "building-relationship": "journey_building",
  "inside-relationship": "journey_inside",
  "after-breakup": "journey_after",
};

export function JourneyPage({ journey }: { journey: JourneyPageData }) {
  const station = stations[journey.id];
  const v = VARIANTS[journey.variant];
  const previewHref = `/preview?tool=${journey.sampleTool}&station=${journey.sampleStation}`;

  const quote = <PullQuote text={journey.pullQuote} tone={v.quoteTone} />;

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: journey.eyebrow, path: `/${journey.id}` },
        ]}
      />
      <StationSchema
        name={journey.h1}
        description={station.metaDescription}
        path={`/${journey.id}`}
      />
      <JourneyView station={journey.id} />

      {/* פירורי לחם */}
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
          <li aria-current="page" className="font-medium text-foreground">
            {journey.eyebrow}
          </li>
        </ol>
      </nav>

      {/* A. Hero — kicker → כותרת גדולה → שיקוף → אמירת מצב-רוח. הרכב לפי variant. */}
      {v.hero === "split" ? (
        <header className="enter-stagger mt-8 lg:mt-12 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-12">
          <div
            className={cn(
              "lg:col-span-7",
              v.moodSide === "start" && "lg:order-2",
            )}
          >
            <span className="kicker">{journey.eyebrow}</span>
            <h1 className="mt-5 max-w-[20ch] font-serif text-[clamp(2.1rem,4.6vw,3.6rem)] font-bold leading-[1.08] tracking-[-0.01em] text-foreground [text-wrap:balance]">
              {journey.h1}
            </h1>
            <p className="mt-6 max-w-[46ch] text-[clamp(1.1rem,1.5vw,1.3125rem)] leading-relaxed text-foreground-muted [text-wrap:pretty]">
              {journey.intro}
            </p>
          </div>
          <div
            className={cn(
              "mt-8 lg:mt-0 lg:col-span-5 lg:self-end",
              v.moodSide === "start" && "lg:order-1",
            )}
          >
            <p
              className={cn(
                "border-brand pt-5 font-serif text-[clamp(1.375rem,2.1vw,1.9rem)] italic leading-[1.35] text-brand-hover [text-wrap:balance]",
                "border-t-2 lg:border-t-0",
                v.moodSide === "start"
                  ? "lg:border-e-2 lg:pe-6"
                  : "lg:border-s-2 lg:ps-6",
              )}
            >
              {journey.moodLine}
            </p>
          </div>
        </header>
      ) : (
        <header className="enter-stagger mx-auto mt-10 max-w-[46ch] text-center lg:mt-16">
          <span className="kicker justify-center">{journey.eyebrow}</span>
          <h1 className="mx-auto mt-5 max-w-[22ch] font-serif text-[clamp(2.1rem,4.6vw,3.6rem)] font-bold leading-[1.1] tracking-[-0.01em] text-foreground [text-wrap:balance]">
            {journey.h1}
          </h1>
          <p className="mx-auto mt-6 max-w-[42ch] text-[clamp(1.1rem,1.5vw,1.3125rem)] leading-relaxed text-foreground-muted [text-wrap:pretty]">
            {journey.intro}
          </p>
          <p className="mx-auto mt-8 max-w-[34ch] font-serif text-[clamp(1.375rem,2.1vw,1.85rem)] italic leading-[1.35] text-brand-hover [text-wrap:balance]">
            {journey.moodLine}
          </p>
        </header>
      )}

      <div className={cn("mt-16 lg:mt-24", v.rhythm)}>
        {/* B. „מה באמת קורה בשלב הזה” — שיקוף (לא עצות). כותרת ברֵיל צדדי + טקסט. */}
        <section
          aria-labelledby="whats-happening-heading"
          className="reveal lg:grid lg:grid-cols-12 lg:gap-x-12"
        >
          <div className="lg:col-span-4">
            <span className="kicker">שיקוף</span>
            <h2
              id="whats-happening-heading"
              className="mt-4 font-serif text-[clamp(1.6rem,2.6vw,2.25rem)] font-bold leading-[1.15] text-foreground [text-wrap:balance]"
            >
              {journey.whatsHappeningHeading}
            </h2>
          </div>
          <div className="mt-6 flex max-w-[60ch] flex-col gap-5 lg:col-span-8 lg:mt-0">
            {journey.whatsHappening.map((para, i) => (
              <p
                key={i}
                className={cn(
                  "text-[1.125rem] leading-[1.75] text-foreground/90 [text-wrap:pretty]",
                  i === 0 &&
                    "text-[clamp(1.2rem,1.7vw,1.4rem)] font-medium leading-[1.6] text-foreground",
                )}
              >
                {para}
              </p>
            ))}
          </div>
        </section>

        {/* Early Reading Entry — נקודת כניסה מוקדמת ושקטה לטעימה, מיד אחרי
            ה-reflection הראשון: לקורא שכבר זיהה את עצמו ורוצה להיכנס לספר בלי
            לעבור עוד שלושה מסכים. קישור editorial (לא band/כפתור מלא), אל אותה
            טעימה מותאמת של הפעולה הראשית. ה-Primary block המלא נשאר בסוף הקשת. */}
        <div className="reveal border-t border-border pt-6">
          <BookLink
            href={previewHref}
            morphCover
            className="group inline-flex items-center gap-2.5 text-[1.0625rem] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [text-wrap:pretty]"
          >
            {journey.earlyCtaLabel}
            <ArrowLeft
              className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
              aria-hidden="true"
            />
          </BookLink>
        </div>

        {/* ציטוט-העצירה כפסק שקט (variant בהירות/מרחב). */}
        {v.quoteAfter === "reflection" && quote}

        {/* C. שלוש נקודות-עומק — ממוספרות 01/02/03, כותרת + משפט הסבר לכל אחת. */}
        <section aria-labelledby="depth-heading" className="reveal">
          <h2 id="depth-heading" className="kicker">
            {journey.depthHeading}
          </h2>
          {v.points === "grid" ? (
            <ol className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {journey.depthPoints.map((p, i) => (
                <li
                  key={p.title}
                  className="border-t border-border-strong pt-5"
                >
                  <span
                    aria-hidden="true"
                    className="font-serif text-[2rem] font-bold leading-none text-brand/85"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-serif text-[1.375rem] font-bold leading-tight text-foreground [text-wrap:balance]">
                    {p.title}
                  </h3>
                  <p className="mt-2.5 text-[1.0625rem] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                    {p.line}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <ol className="mt-8 flex flex-col">
              {journey.depthPoints.map((p, i) => (
                <li
                  key={p.title}
                  className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 border-t border-border-strong py-6 sm:gap-x-8 lg:grid-cols-[5rem_1fr]"
                >
                  <span
                    aria-hidden="true"
                    className="font-serif text-[2.25rem] font-bold leading-none text-brand/85 sm:text-[2.75rem]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="max-w-[52ch]">
                    <h3 className="font-serif text-[clamp(1.375rem,2vw,1.625rem)] font-bold leading-tight text-foreground [text-wrap:balance]">
                      {p.title}
                    </h3>
                    <p className="mt-2.5 text-[1.0625rem] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                      {p.line}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ציטוט-העצירה כשיא-מומנטום/עומק (variant תנועה/עומק). */}
        {v.quoteAfter === "points" && quote}

        {/* „שאלת מראה” — שאלה אחת לעצור עליה. אלמנט editorial (לא form/input/כפתור):
            בולט טיפוגרפית, אישי, עם קו-רייל צדדי — נבדל מציטוט-העצירה הממורכז. */}
        <section aria-labelledby="mirror-question" className="reveal">
          <div className="mx-auto max-w-[52ch] border-s-2 border-brand ps-5 sm:ps-8">
            <span className="kicker">רגע של מראה</span>
            <p
              id="mirror-question"
              className="mt-3 font-serif text-[clamp(1.375rem,2.4vw,2rem)] font-medium italic leading-[1.4] text-foreground [text-wrap:balance]"
            >
              {journey.mirrorQuestion}
            </p>
            {/* מיד אחרי „רגע של מראה” — כניסה לעוזר, בהקשר-המצב של המסלול. */}
            <AskBookLink
              station={journey.compassStation}
              prompt={askBook.inlinePrompt}
              className="mt-6 border-t border-border pt-5"
            />
          </div>
        </section>

        {/* E. „מה הספר יעזור לכם לראות” — תובנות ממוקדות (בלי הבטחת תוצאה). */}
        <section
          aria-labelledby="book-helps-heading"
          className="reveal lg:grid lg:grid-cols-12 lg:gap-x-12"
        >
          <div className="lg:col-span-4">
            <span className="kicker">מהספר</span>
            <h2
              id="book-helps-heading"
              className="mt-4 font-serif text-[clamp(1.6rem,2.6vw,2.25rem)] font-bold leading-[1.15] text-foreground [text-wrap:balance]"
            >
              {journey.bookHelpsHeading}
            </h2>
          </div>
          <ul className="mt-6 flex max-w-[58ch] flex-col divide-y divide-border lg:col-span-8 lg:mt-0">
            {journey.bookHelps.map((help) => (
              <li
                key={help}
                className="flex items-start gap-4 py-4 first:pt-0"
              >
                <span
                  aria-hidden="true"
                  className="mt-[0.6rem] h-1.5 w-6 shrink-0 rounded-full bg-brand"
                />
                <span className="text-[1.0625rem] leading-relaxed text-foreground/90 [text-wrap:pretty]">
                  {help}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* F+G+H. משפט-מעבר → טעימה מותאמת (פעולה ראשית) → „שאל את הספר” (משני). */}
        <section
          aria-label="להמשך הקריאה"
          className="reveal overflow-hidden rounded-3xl border border-border bg-surface-muted/60 px-6 py-10 sm:px-10 sm:py-12 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-12 lg:px-12"
        >
          <div className="lg:col-span-7">
            <span className="kicker">טעימה מהספר</span>
            <p className="mt-4 max-w-[46ch] font-serif text-[clamp(1.3rem,1.9vw,1.6rem)] leading-[1.5] text-foreground [text-wrap:pretty]">
              {journey.sampleLead}
            </p>
          </div>
          <div className="mt-7 flex flex-col items-start gap-4 lg:col-span-5 lg:mt-0 lg:items-end">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <BookLink href={previewHref} morphCover>
                {journey.samplePrimaryLabel}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </BookLink>
            </Button>
            <AskBookLink station={journey.compassStation} />
          </div>
        </section>

        {/* I. Next step — רך, שונה לפי מסלול: הספר המלא + תחנת-המשך ייעודית. J בסוף. */}
        <section
          aria-labelledby="next-heading"
          className="reveal border-t border-border pt-10"
        >
          <h2
            id="next-heading"
            className="font-serif text-[1.25rem] font-bold text-foreground"
          >
            מה כדאי לקרוא מכאן
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/book"
              className="group inline-flex items-center gap-2 text-[16px] font-semibold text-foreground underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <BookOpen className="h-4 w-4 text-brand" aria-hidden="true" />
              מה עוד מחכה בספר
            </Link>
            <p className="max-w-[60ch] text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
              {journey.nextStep.prompt}{" "}
              <Link
                href={journey.nextStep.href}
                className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                {journey.nextStep.label}
              </Link>
            </p>
          </div>
        </section>

        {/* אשכול המדריכים — כל תחנה היא ה-hub של המדריכים ששויכו אליה (לפי
            guide.hub.href). מוצג רק את המדריכים של התחנה הנוכחית, כדי לא לשכפל
            בין תחנות ולא לקנבל את עמוד-האם. */}
        {(() => {
          const stationGuides = guideOrder
            .map((slug) => guides[slug])
            .filter((g) => g.hub.href === `/${journey.id}`);
          if (stationGuides.length === 0) return null;
          return (
            <section
              aria-labelledby="guides-heading"
              className="reveal border-t border-border pt-10"
            >
              <h2
                id="guides-heading"
                className="font-serif text-[1.25rem] font-bold text-foreground"
              >
                מדריכים להעמקה בשאלות ספציפיות
              </h2>
              <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                עמוד זה הוא נקודת-המוצא; לכל שאלה יש מדריך ייעודי מתוך הגישה של הספר.
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {stationGuides.map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={g.path}
                      className="lift-hover group flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 hover:border-brand/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <span className="font-serif text-[15px] font-semibold leading-tight text-foreground">
                        {g.metaTitle}
                      </span>
                      <ArrowLeft
                        className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })()}
      </div>

      {/* Purchase exit — פעם אחת בלבד, אחרי הקשת: הספר המלא זמין עכשיו באמזון. */}
      <div className="mt-14 rounded-2xl border border-border bg-surface-muted/60 px-6 py-7 text-center sm:px-10">
        <p className="mx-auto max-w-[42ch] font-serif text-[clamp(1.15rem,1.7vw,1.4rem)] leading-[1.5] text-foreground [text-wrap:pretty]">
          רוצים את הספר המלא? זמין עכשיו במהדורת Kindle באמזון.
        </p>
        <div className="mt-5">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <AmazonBuyLink source={AMAZON_SOURCE[journey.id]}>
              לרכישה באמזון
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </AmazonBuyLink>
          </Button>
        </div>
      </div>

      {/* J. „זה לא המקום שלי” — קישור שקט חזרה לבורר, לא בורר מלא בעמוד. */}
      <div className="mt-12">
        <Link
          href="/#path"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          זה לא המקום שלי — בחרו מסלול אחר
        </Link>
      </div>
    </Container>
  );
}

/**
 * D. Moment of recognition — משפט גדול לעצור עליו. שתי הופעות: פס-רקע מלא („band”)
 * או ציטוט חשוף בין שני קווי-שׂיא („rule”). ממוקם בזרימה לפי ה-variant.
 */
function PullQuote({ text, tone }: { text: string; tone: "band" | "rule" }) {
  if (tone === "band") {
    return (
      <figure className="reveal -mx-6 rounded-none bg-secondary-muted px-6 py-14 sm:mx-0 sm:rounded-3xl sm:px-10 sm:py-16 lg:py-20">
        <blockquote className="mx-auto max-w-[24ch] text-center font-serif text-[clamp(1.75rem,3.6vw,3rem)] font-bold leading-[1.2] tracking-[-0.01em] text-secondary [text-wrap:balance]">
          {text}
        </blockquote>
      </figure>
    );
  }
  return (
    <figure className="reveal border-y border-border-strong py-12 sm:py-16 lg:py-20">
      <blockquote className="mx-auto max-w-[26ch] text-center font-serif text-[clamp(1.75rem,3.6vw,3rem)] font-semibold leading-[1.22] tracking-[-0.01em] text-foreground [text-wrap:balance]">
        <span aria-hidden="true" className="text-brand">
          „
        </span>
        {text}
        <span aria-hidden="true" className="text-brand">
          ”
        </span>
      </blockquote>
    </figure>
  );
}
