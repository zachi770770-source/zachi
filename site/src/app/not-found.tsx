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
        הבית, או לקפוץ ישר לרכישת הספר.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">חזרה לעמוד הבית</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/#purchase">לרכישת הספר</Link>
        </Button>
      </div>
    </Container>
  );
}
