import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { authorContent } from "@/content/author";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { AuthorAudio } from "@/components/author/AuthorAudio";
import { AuthorPageView } from "@/components/author/AuthorPageView";
import { PersonSchema } from "@/components/schema/PersonSchema";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata = pageMetadata({
  title: "על המחבר",
  description: `צחי חן מספר למה כתב את ${siteConfig.bookTitle}, למי הספר נכתב ומה מטרתו.`,
  path: "/author",
  ogType: "article",
});

const PHOTO_ALT = "צחי חן, מחבר הספר מדייטים לאהבה";
const PHOTO_SIZES = "(min-width: 1024px) 380px, (min-width: 640px) 360px, 78vw";

export default function AuthorPage() {
  // פעולה מרכזית אחת בעמוד המחבר: לקרוא טעימה. ההרשמה לרשימת ההמתנה
  // מרוכזת בסוף הטעימה. כשהמכירה נפתחת — הפעולה המרכזית הופכת לרכישה.
  const primaryHref = siteConfig.salesOpen ? "/book#purchase" : "/preview";
  const primaryLabel = siteConfig.salesOpen ? "לרכישת הספר" : "לקריאת טעימה מהספר";

  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <AuthorPageView />
      <PersonSchema />
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "על המחבר", path: "/author" },
        ]}
      />

      {/* Hero — תמונת המחבר לצד הכותרת */}
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-16">
        <div className="order-1 mx-auto w-full max-w-[300px] sm:max-w-[360px] lg:mx-0 lg:max-w-none">
          <div className="portrait-reveal relative">
            <div
              aria-hidden="true"
              className="absolute -inset-3 -z-10 rounded-[1.75rem] bg-secondary/[0.08]"
            />
            <picture>
              <source
                type="image/avif"
                sizes={PHOTO_SIZES}
                srcSet="/images/author/zachi-chen-640.avif 640w, /images/author/zachi-chen-960.avif 960w, /images/author/zachi-chen-1280.avif 1280w"
              />
              <source
                type="image/webp"
                sizes={PHOTO_SIZES}
                srcSet="/images/author/zachi-chen-640.webp 640w, /images/author/zachi-chen-960.webp 960w, /images/author/zachi-chen-1280.webp 1280w"
              />
              <img
                src="/images/author/zachi-chen-960.jpg"
                width={1600}
                height={2000}
                alt={PHOTO_ALT}
                loading="eager"
                decoding="async"
                className="block w-full rounded-3xl object-cover shadow-[0_34px_64px_-32px_rgba(43,36,31,0.55)] ring-1 ring-border-strong/60"
              />
            </picture>
          </div>
        </div>

        <div className="enter-stagger order-2 flex flex-col items-start text-start">
          <span className="kicker">
            {siteConfig.author.name}, מחבר {siteConfig.bookTitle}
          </span>
          <h1 className="mt-4 font-serif text-[clamp(1.95rem,4.2vw,2.85rem)] font-semibold leading-[1.15] text-foreground">
            {authorContent.sectionTitle}
          </h1>
          <p className="mt-5 font-serif text-[clamp(1.15rem,2vw,1.4rem)] italic text-brand-hover">
            {siteConfig.tagline}
          </p>
          {/* קו מבנה זעיר — מחבר את סיפור המחבר לתזת הספר („חיפוש→בנייה”). */}
          <span
            aria-hidden="true"
            className="mt-6 flex items-center gap-1.5 opacity-80"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
            <span className="line-draw h-px w-8 bg-border-strong sm:w-12" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="line-draw h-px w-8 bg-border-strong sm:w-12" />
            <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
          </span>
        </div>
      </div>

      {/* גוף הטקסט — עמודה צרה וקריאה. חשיפה מקובצת אחת, לא פסקה-פסקה. */}
      <div className="reveal mx-auto mt-12 flex max-w-[64ch] flex-col gap-6 sm:mt-16">
        {authorContent.fullBio.map((paragraph, index) => (
          <p
            key={index}
            className="text-[1.075rem] leading-[1.85] text-foreground/90 sm:text-[1.15rem]"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* „למה כתבתי את הספר הזה” — שמע בקולו של המחבר (או placeholder + תמלול) */}
      <AuthorAudio />

      {/* קריאה לפעולה */}
      <div className="mx-auto mt-12 flex max-w-[64ch] flex-col items-start gap-x-8 gap-y-4 border-t border-border pt-8 sm:flex-row sm:items-center">
        <Button asChild size="lg" className="w-full px-7 text-[16px] sm:w-auto">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
        {/* לאחר פתיחת המכירה, הטעימה נשארת פעולה משנית לצד הרכישה. */}
        {siteConfig.salesOpen ? (
          <Link
            href="/preview"
            className="group inline-flex items-center gap-2 text-[16px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            לקריאת טעימה מהספר
            <ArrowLeft
              className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ) : null}
      </div>
    </Container>
  );
}
