import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  headingId,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "start";
  className?: string;
  headingId?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start text-start",
        className
      )}
    >
      {eyebrow ? (
        <span className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-hover">
          {eyebrow}
        </span>
      ) : null}
      <h2
        id={headingId}
        className="text-balance font-serif text-3xl font-semibold leading-[1.2] sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-balance text-lg leading-relaxed text-foreground-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
