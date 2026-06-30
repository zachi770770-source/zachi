import { cn } from "@/lib/cn";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "neutral" | "clay" | "sage" | "premium";
  className?: string;
}

const tones = {
  neutral: "bg-sand-100 text-ink-500",
  clay: "bg-clay-50 text-clay-500",
  sage: "bg-sage-50 text-sage-500",
  premium: "bg-ink-700 text-sand-100",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
