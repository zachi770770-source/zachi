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
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-start",
        className
      )}
    >
      {eyebrow ? (
        <span className="text-sm font-semibold uppercase tracking-wide text-brand-hover">
          {eyebrow}
        </span>
      ) : null}
      <h2
        id={headingId}
        className="text-balance font-serif text-3xl font-semibold sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-balance text-lg leading-relaxed text-foreground-muted",
            align === "center" ? "max-w-2xl" : "max-w-2xl"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
