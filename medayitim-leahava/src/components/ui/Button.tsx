import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-clay-600 text-sand-50 hover:bg-clay-500",
  secondary:
    "bg-sand-100 text-ink-800 border border-sand-300 hover:bg-sand-200",
  ghost: "text-clay-600 hover:bg-sand-100",
  danger: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-base",
  lg: "px-8 py-3.5 text-lg",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

function classes({ variant = "primary", size = "md", fullWidth }: CommonProps) {
  return [
    base,
    variants[variant],
    sizes[size],
    fullWidth ? "w-full" : "",
  ].join(" ");
}

type ButtonProps = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children">;

export function Button({
  variant,
  size,
  fullWidth,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classes({ variant, size, fullWidth, children })}
      {...props}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = CommonProps &
  Omit<ComponentProps<typeof Link>, "className" | "children">;

export function LinkButton({
  variant,
  size,
  fullWidth,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={classes({ variant, size, fullWidth, children })}
      {...props}
    >
      {children}
    </Link>
  );
}
