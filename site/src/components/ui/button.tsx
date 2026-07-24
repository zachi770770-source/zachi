import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-brand-foreground hover:bg-brand-hover shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:opacity-90",
        outline:
          "border border-border-strong bg-surface text-foreground hover:bg-surface-muted",
        ghost: "bg-transparent text-foreground hover:bg-surface-muted",
        link: "bg-transparent text-brand underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-12 px-6 text-[16px]",
        sm: "h-10 px-4 text-sm",
        lg: "h-[54px] px-8 text-[17px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
