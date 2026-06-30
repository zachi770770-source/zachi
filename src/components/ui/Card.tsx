import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "default" | "warm" | "muted" | "highlight";
}

const tones = {
  default: "bg-white border border-sand-200",
  warm: "bg-sand-100 border border-sand-200",
  muted: "bg-sand-50 border border-sand-100",
  highlight: "bg-clay-50 border border-clay-100",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { tone = "default", className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl p-5 shadow-soft",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
