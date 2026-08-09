import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

import { stations } from "@/content/stations";
import type { JourneyPage as JourneyPageData } from "@/content/journeyPages";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { BookLink } from "@/components/shared/BookLink";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { StationSchema } from "@/components/schema/StationSchema";
import { JourneyView } from "@/components/journey/JourneyView";
import { AskBookLink } from "@/components/journey/AskBookLink";

/**
 * עמוד-מסע אישי (Landing) לאחת מארבע הבחירות ב-Home. מבנה UX עקבי בין הארבעה,
 * אך כל עמוד בשפת-המצב שלו: Hero אישי → שיקוף → 3 נושאים → טעימה מותאמת מהספר
 * (פעולה ראשית) → „שאל את הספר” (משני, עם הקשר-המצב) → מה לקרוא מכאן → עדכון
 * השקה. אין כאן בורר ארבעת-המצבים מחדש (זה יחזיר את הקורא לתפריט) — רק קישור
 * שקט „בחרו מסלול אחר”. הטעימה אמיתית ומגיעה מ-/preview?tool=&station=.
 */
export function JourneyPage({ journey }: { journey: JourneyPageData }) {
  const station = stations[journey.id];
  const previewHref = `/preview?tool=${journey.sampleTool}&station=${journey.sampleStation}`;

  return (
    <Container className="py-8 sm:py-12 lg:py-14">
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

      {/* Hero אישי — kicker → כותרת → שיקוף. */}
      <header className="enter-stagger mx-auto mt-8 max-w-[52ch]">
        <span className="kicker">{journey.eyebrow}</span>
        <h1 className="mt-4 font-serif text-[clamp(1.9rem,4vw,2.85rem)] font-semibold leading-[1.15] text-foreground [text-wrap:balance]">
          {journey.h1}
        </h1>
        <p className="mt-5 text-[clamp(1.1rem,1.6vw,1.3rem)] leading-relaxed text-foreground-muted [text-wrap:pretty]">
          {journey.intro}
        </p>
        {/* שורת מצב-הרוח — הטון הרגשי הייחודי של המסלול, כבר במסך הראשון. */}
        <p className="mt-5 border-e-2 border-brand pe-4 font-serif text-[1.15rem] italic leading-relaxed text-brand-hover [text-wrap:balance]">
          {journey.moodLine}
        </p>
      </header>

      <div className="mx-auto mt-10 flex max-w-[52ch] flex-col gap-10 sm:mt-12">
        {/* שלושה נושאים מרכזיים — קצר וממוקד. */}
        <section aria-labelledby="topics-heading" className="reveal">
          <h2 id="topics-heading" className="kicker">
            {journey.topicsHeading}
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {journey.topics.map((t) => (
              <li
                key={t}
                className="flex items-start gap-3 text-[1.05rem] leading-relaxed text-foreground/90"
              >
                <span
                  aria-hidden="true"
                  className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span className="[text-wrap:pretty]">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* פעולה ראשית: טעימה מותאמת → נחיתה על קטע אמיתי מהספר. „שאל את הספר”
            משני, עם הקשר-המצב (כדי לא לשאול שוב „איפה אתם?”). */}
        <section
          aria-labelledby="cta-heading"
          className="reveal flex flex-col items-start gap-4 border-t border-border pt-8"
        >
          <h2 id="cta-heading" className="sr-only">
            להמשך הקריאה
          </h2>
          {/* משפט-מעבר לטעימה — ממסגר את נושא הכלי בשפת-המצב (התוכן מהספר עצמו). */}
          <p className="text-[1.05rem] leading-relaxed text-foreground/90 [text-wrap:pretty]">
            {journey.sampleLead}
          </p>
          <Button asChild size="lg" className="w-full px-7 sm:w-auto">
            <BookLink href={previewHref} morphCover>
              {journey.samplePrimaryLabel}
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </BookLink>
          </Button>
          <AskBookLink station={journey.compassStation} />
        </section>

        {/* מה כדאי לקרוא מכאן — קישור אחד עיקרי (הספר המלא), ולתחנת-המעבר בלבד
            הצעת-המשך עדינה ל„מתחילים מחדש” (לא CTA ראשי). */}
        <section
          aria-labelledby="next-heading"
          className="reveal border-t border-border pt-8"
        >
          <h2 id="next-heading" className="font-serif text-xl font-semibold text-foreground">
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
            {journey.nextStep ? (
              <p className="text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                {journey.nextStep.prompt}{" "}
                <Link
                  href={journey.nextStep.href}
                  className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  {journey.nextStep.label}
                </Link>
              </p>
            ) : null}
          </div>
        </section>

        {/* עדכון השקה — פעולה שקטה אחת (טרום-השקה). */}
        <section
          aria-labelledby="launch-heading"
          className="reveal rounded-2xl bg-secondary-muted px-6 py-6 sm:px-8"
        >
          <h2 id="launch-heading" className="font-serif text-lg font-semibold text-foreground">
            הספר עדיין לפני השקה
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-muted">
            השאירו אימייל ונעדכן אתכם ברגע שהוא יוצא. בלי ספאם.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/waitlist">עדכנו אותי כשהספר יוצא</Link>
          </Button>
        </section>
      </div>

      {/* „זה לא המקום שלי” — קישור שקט חזרה לבורר, לא בורר מלא בתוך העמוד. */}
      <div className="mx-auto mt-12 max-w-[52ch]">
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
