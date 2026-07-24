"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, ZoomIn } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

type Page = { src: string; alt: string };

const pages: Page[] = [
  { src: "/images/book/page-sample-1.svg", alt: "עמוד לדוגמה מהחלק הראשון של הספר" },
  { src: "/images/book/page-sample-2.svg", alt: "עמוד לדוגמה מהחלק השני של הספר" },
  { src: "/images/book/page-sample-3.svg", alt: "עמוד לדוגמה מהחלק השלישי של הספר" },
];

export function PreviewGallery() {
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  function openAt(i: number) {
    setIndex(i);
    setOpen(true);
    trackEvent("view_sample", { page_index: i });
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {pages.map((page, i) => (
          <button
            key={page.src}
            type="button"
            onClick={() => openAt(i)}
            className="group relative overflow-hidden rounded-md border border-border shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Image
              src={page.src}
              alt={page.alt}
              width={500}
              height={700}
              unoptimized
              className="h-auto w-full"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
              <ZoomIn
                className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </span>
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(92vw,28rem)] p-4">
          <DialogTitle className="sr-only">הצצה מוגדלת לעמוד מהספר</DialogTitle>
          <DialogDescription className="sr-only">
            ניתן לעבור בין עמודי הדוגמה באמצעות החצים.
          </DialogDescription>

          <div className="relative">
            <Image
              src={pages[index].src}
              alt={pages[index].alt}
              width={500}
              height={700}
              unoptimized
              className="mx-auto h-auto w-full max-w-xs rounded-md"
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + pages.length) % pages.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-strong text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label="העמוד הקודם"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex gap-1.5">
              {pages.map((page, i) => (
                <span
                  key={page.src}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    i === index ? "bg-brand" : "bg-border-strong"
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % pages.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-strong text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label="העמוד הבא"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
