import { cn } from "@/lib/cn";

interface QuoteProps {
  children: React.ReactNode;
  source?: string;
  className?: string;
}

export function Quote({ children, source, className }: QuoteProps) {
  return (
    <blockquote
      className={cn(
        "border-r-2 border-clay-300 pr-5 py-2 font-serif text-ink-600",
        className,
      )}
    >
      <p className="text-lg leading-relaxed">{children}</p>
      {source && (
        <footer className="mt-2 text-xs text-ink-400 font-sans">{source}</footer>
      )}
    </blockquote>
  );
}
