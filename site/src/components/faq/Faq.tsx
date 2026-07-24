"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trackEvent } from "@/lib/analytics";
import type { FaqItem } from "@/content/faq";

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-lg border border-border bg-surface px-5"
      onValueChange={(value) => {
        if (value) trackEvent("faq_open", { question_id: value });
      }}
    >
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
