import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, className, ...rest },
  ref,
) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink-500 mb-2">{label}</span>}
      <input
        ref={ref}
        className={cn(
          "w-full bg-white border border-sand-200 rounded-xl h-12 px-4 text-base text-ink-700 placeholder:text-ink-300",
          "focus:border-clay-300 focus:outline-none transition-colors",
          className,
        )}
        {...rest}
      />
    </label>
  );
});
