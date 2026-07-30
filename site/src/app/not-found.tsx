import Link from "next/link";
import { BookX } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-muted text-brand">
        <BookX className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-serif text-4xl font-semibold">
        העמוד לא נמצא
      </h1>
      <p className="mt-3 max-w-md text-lg leading-relaxed text-foreground-muted">
        נראה שהעמוד שחיפשתם לא קיים, או שהקישור השתנה. אפשר לחזור לעמוד
        הבית, לקרוא טעימה מהספר, או להצטרף לרשימת ההמתנה.
      </p>
      {/* היררכיה ברורה: פעולה ראשית אחת בולטת, ושתי פעולות משניות עדינות. */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <Button asChild size="lg">
          <Link href="/">חזרה לעמוד הבית</Link>
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <Button asChild variant="link" className="min-h-[44px]">
            <Link href="/preview">לקריאת טעימה</Link>
          </Button>
          <Button asChild variant="link" className="min-h-[44px]">
            <Link href="/waitlist">לרשימת ההמתנה</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
