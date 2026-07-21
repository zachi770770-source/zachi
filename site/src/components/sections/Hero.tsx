import Image from "next/image";
import Link from "next/link";

import { hero } from "@/content/book";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { TrustBar } from "@/components/sections/TrustBar";

export function Hero() {
  return (
    <section className="border-b border-border bg-gradient-to-b from-surface-muted to-background py-8 sm:py-14">
      <Container>
        <div className="grid items-center gap-6 md:grid-cols-2 md:gap-14">
          <div className="order-1 flex flex-col items-start gap-5 text-start sm:gap-6">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">
              {hero.eyebrow}
            </span>
            <h1 className="text-balance font-serif text-5xl font-bold leading-[1.1] sm:text-6xl">
              {hero.title}
            </h1>
            <p className="text-balance font-serif text-xl text-brand sm:text-2xl">
              {hero.tagline}
            </p>
            <p className="max-w-xl text-lg leading-[1.75] text-foreground-muted sm:text-xl">
              {hero.description}
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg">
                <Link href="/#purchase">{hero.primaryCta}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/preview">{hero.secondaryCta}</Link>
              </Button>
            </div>

            <TrustBar />
          </div>

          <div className="order-2 flex justify-center md:order-2">
            <div className="relative w-full max-w-[240px] sm:max-w-[300px]">
              <div
                className="absolute inset-0 -z-10 translate-y-6 rounded-[2rem] bg-brand/10 blur-2xl"
                aria-hidden="true"
              />
              <Image
                src={siteConfig.images.mockup3d}
                alt={siteConfig.images.mockup3dAlt}
                width={640}
                height={900}
                priority
                unoptimized
                className="h-auto w-full rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
