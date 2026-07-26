import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { waitlistPage } from "@/content/stations";
import { Container } from "@/components/shared/Container";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata: Metadata = {
  title: waitlistPage.metaTitle,
  description: waitlistPage.metaDescription,
  alternates: { canonical: "/waitlist" },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: "/waitlist",
    title: waitlistPage.metaTitle,
    description: waitlistPage.metaDescription,
  },
};

export default function WaitlistPage() {
  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "רשימת המתנה", path: "/waitlist" },
        ]}
      />

      <div className="mx-auto grid max-w-4xl items-start gap-10 rounded-3xl border border-border bg-surface px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-14">
        <div>
          <span className="kicker">{waitlistPage.eyebrow}</span>
          <h1 className="mt-4 font-serif text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold leading-[1.15] text-foreground">
            {waitlistPage.h1}
          </h1>
          <p className="mt-5 max-w-[46ch] text-[1.075rem] leading-[1.8] text-foreground-muted">
            {waitlistPage.intro}
          </p>

          <h2 className="mt-8 text-[15px] font-semibold text-foreground">
            {waitlistPage.whatYouGetTitle}
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {waitlistPage.whatYouGet.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-hover"
                  aria-hidden="true"
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-[16px] leading-relaxed text-foreground/90">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full text-start lg:sticky lg:top-28">
          <WaitlistForm source="waitlist" />
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-4xl text-center">
        <Link
          href="/preview"
          className="text-[15px] font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          בינתיים אפשר לקרוא טעימה מהספר
        </Link>
      </div>
    </Container>
  );
}
