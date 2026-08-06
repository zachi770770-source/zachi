import Link from "next/link";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import {
  stations,
  stationOrder,
  stationsUi,
  type Station,
} from "@/content/stations";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { StationSchema } from "@/components/schema/StationSchema";
import { RouteIllustration } from "@/components/shared/RouteIllustration";
import { stationPageIllustration } from "@/content/routeIllustrations";

/**
 * רכיב משותף לשלושת דפי התחנות. מקבל אובייקט תחנה יחיד ומרנדר את הדף
 * המלא: פירורי לחם, כותרת, תיאור הקושי, מה הספר מציע, הפרקים הרלוונטיים,
 * קטע מהספר, שאלה למחשבה, CTA לפי מצב המכירה, ומעבר לשתי התחנות האחרות.
 * כל שלושת הדפים חולקים את אותה שפה חזותית ואת אותו רכיב — ללא כפילות קוד.
 */
export function StationPage({ station }: { station: Station }) {
  // פעולה מרכזית אחת לדף התחנה: לקרוא את הטעימה שמתאימה לקורא. בקשת ההרשמה
  // לרשימת ההמתנה מרוכזת בסוף עמוד הטעימה, לא כאן. כשהמכירה נפתחת — רכישה.
  const primaryHref = siteConfig.salesOpen ? "/book#purchase" : "/preview";
  const primaryLabel = siteConfig.salesOpen
    ? "לרכישת הספר"
    : "לקריאת הטעימה שמתאימה לי";

  // תחנה מרכזית = אחת משלוש התחנות במחזור. „אחרי פרידה” (שער) ו„מתחילים מחדש”
  // (גשר) אינם במחזור — הם מציגים kicker משלהם, בלי מחוון-המסע, ומקשרים דרך
  // `related` המפורש במקום „שתי התחנות האחרות”.
  const isCore = stationOrder.includes(station.id);
  const currentIndex = stationOrder.indexOf(station.id);

  const others = (
    station.related ?? stationOrder.filter((id) => id !== station.id)
  ).map((id) => stations[id]);

  const eyebrow = station.eyebrow ?? stationsUi.eyebrow;
  const relatedTitle = station.relatedTitle ?? stationsUi.otherStationsTitle;
  // איור מאושר לתחנה — רק כשההתאמה הסמנטית נקייה.
  const illustration = stationPageIllustration[station.id];

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: station.navLabel, path: `/${station.id}` },
        ]}
      />
      <StationSchema
        name={station.h1}
        description={station.metaDescription}
        path={`/${station.id}`}
      />

      {/* פירורי לחם נגישים */}
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
            {station.navLabel}
          </li>
        </ol>
      </nav>

      {/* כותרת — כניסה מתואמת (kicker → כותרת → תיאור → מחוון מסע). */}
      <header className="enter-stagger mx-auto mt-8 max-w-[54ch]">
        <span className="kicker">{eyebrow}</span>
        <h1 className="mt-4 font-serif text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-[1.15] text-foreground">
          {station.h1}
        </h1>
        <p className="mt-5 text-[clamp(1.1rem,1.6vw,1.3rem)] leading-relaxed text-foreground-muted">
          {station.lead}
        </p>
        {/* מחוון מסע מרוסן — התחנה הנוכחית מתוך שלוש. דקורטיבי, לתחנות המרכזיות
            בלבד (לא לשער המעבר ולגשר החזרה). */}
        <div
          aria-hidden="true"
          className={`mt-7 flex items-center gap-2.5 ${isCore ? "" : "hidden"}`}
        >
          {stationOrder.map((id, i) => (
            <span key={id} className="flex items-center gap-2.5">
              {i > 0 ? (
                <span
                  className={`h-px w-7 sm:w-12 ${
                    i <= currentIndex ? "bg-brand/45" : "bg-border-strong"
                  }`}
                />
              ) : null}
              <span
                className={
                  i === currentIndex
                    ? "h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-brand/15"
                    : i < currentIndex
                      ? "h-2 w-2 rounded-full bg-brand/55"
                      : "h-2 w-2 rounded-full bg-border-strong"
                }
              />
            </span>
          ))}
        </div>
      </header>

      {/* איור התחנה — חלק מאזור הפתיחה, לא מקטע חדש. נטען בעצלות, מתחת לקפל. */}
      {illustration ? (
        <RouteIllustration
          illustration={illustration}
          className="reveal mt-10 max-w-[60ch]"
        />
      ) : null}

      <div className="mx-auto mt-12 flex max-w-[64ch] flex-col gap-12 sm:mt-14">
        {/* תיאור הקושי */}
        <section aria-labelledby="difficulty-heading" className="reveal">
          <h2
            id="difficulty-heading"
            className="font-serif text-2xl font-semibold text-foreground"
          >
            {station.difficulty.title}
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {station.difficulty.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[1.075rem] leading-[1.85] text-foreground/90"
              >
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* מה הספר מציע */}
        <section aria-labelledby="offer-heading" className="reveal">
          <h2
            id="offer-heading"
            className="font-serif text-2xl font-semibold text-foreground"
          >
            {station.offer.title}
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {station.offer.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[1.075rem] leading-[1.85] text-foreground/90"
              >
                {p}
              </p>
            ))}
          </div>
          {station.highlight ? (
            <p className="mt-6 border-e-2 border-brand pe-4 font-serif text-xl italic leading-relaxed text-brand-hover">
              {station.highlight}
            </p>
          ) : null}
        </section>

        {/* הפרקים הרלוונטיים */}
        <section aria-labelledby="chapters-heading" className="reveal">
          <h2
            id="chapters-heading"
            className="font-serif text-2xl font-semibold text-foreground"
          >
            {stationsUi.chaptersTitle}
          </h2>
          <ul className="mt-5 flex flex-col gap-4">
            {station.chapters.map((chapter) => (
              <li
                key={chapter.title}
                className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
              >
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  {chapter.title}
                </h3>
                <p className="mt-2 text-[16px] leading-relaxed text-foreground-muted">
                  {chapter.note}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* קטע מהספר */}
        <section aria-labelledby="excerpt-heading" className="reveal">
          <h2 id="excerpt-heading" className="kicker">
            {stationsUi.excerptTitle}
          </h2>
          <blockquote className="mt-4 border-e-2 border-brand pe-5 text-lg italic leading-[1.85] text-foreground-muted">
            &ldquo;{station.excerpt}&rdquo;
          </blockquote>
        </section>

        {/* שאלה למחשבה */}
        <section
          aria-labelledby="question-heading"
          className="reveal rounded-2xl bg-surface-muted p-6 sm:p-8"
        >
          <h2 id="question-heading" className="kicker">
            {stationsUi.questionTitle}
          </h2>
          <p className="mt-3 font-serif text-[1.2rem] leading-relaxed text-foreground">
            {station.question}
          </p>
        </section>

        {/* קריאה לפעולה */}
        <section
          aria-labelledby="cta-heading"
          className="reveal flex flex-col items-start gap-x-8 gap-y-4 border-t border-border pt-8 sm:flex-row sm:items-center"
        >
          <h2 id="cta-heading" className="sr-only">
            להמשך
          </h2>
          <Button asChild size="lg" className="w-full px-7 sm:w-auto">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {/* לאחר פתיחת המכירה, הטעימה נשארת כפעולה משנית לצד הרכישה. */}
          {siteConfig.salesOpen ? (
            <Link
              href="/preview"
              className="group inline-flex items-center gap-2 text-[16px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {stationsUi.sampleCta}
              <ArrowLeft
                className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                aria-hidden="true"
              />
            </Link>
          ) : null}
        </section>
      </div>

      {/* מעבר לשתי התחנות האחרות */}
      <section
        aria-labelledby="other-stations-heading"
        className="reveal mx-auto mt-16 max-w-[64ch] border-t border-border pt-10"
      >
        <h2
          id="other-stations-heading"
          className="font-serif text-xl font-semibold text-foreground"
        >
          {relatedTitle}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {others.map((other) => (
            <Link
              key={other.id}
              href={`/${other.id}`}
              className="lift-hover group flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5 hover:border-brand/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <div>
                <span className="font-serif text-lg font-semibold text-foreground">
                  {other.navLabel}
                </span>
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  {other.lead}
                </p>
              </div>
              <ArrowUpLeft
                className="h-5 w-5 shrink-0 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5 group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {stationsUi.backHome}
          </Link>
        </div>
      </section>
    </Container>
  );
}
