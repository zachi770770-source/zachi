"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-ink-700 text-sand-50 hover:bg-ink-600 active:bg-ink-700 disabled:bg-ink-300",
  secondary:
    "bg-clay-300 text-ink-700 hover:bg-clay-400 hover:text-sand-50 active:bg-clay-400",
  outline:
    "bg-transparent border border-ink-200 text-ink-600 hover:bg-sand-100 hover:border-ink-300",
  ghost:
    "bg-transparent text-ink-600 hover:bg-sand-100 active:bg-sand-200",
  danger:
    "bg-accent-400 text-sand-50 hover:bg-accent-500 active:bg-accent-500",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-11 px-5 text-base rounded-xl",
  lg: "h-14 px-7 text-base rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
