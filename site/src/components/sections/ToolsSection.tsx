import { Wrench } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { tools } from "@/content/book";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ToolsSection() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="tools-heading">
      <Container>
        <SectionHeading
          eyebrow="כלים מהספר"
          title={tools.title}
          description={tools.description}
          headingId="tools-heading"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.items.map((tool) => (
            <Card key={tool.name} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Wrench className="h-4 w-4" aria-hidden="true" />
                </span>
                <CardTitle className="text-lg">{tool.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed text-foreground-muted">
                  {tool.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
