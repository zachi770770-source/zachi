import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, className, ...rest },
  ref,
) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink-500 mb-2">{label}</span>}
      <textarea
        ref={ref}
        className={cn(
          "w-full bg-white border border-sand-200 rounded-2xl p-4 text-base text-ink-700 placeholder:text-ink-300",
          "focus:border-clay-300 focus:outline-none transition-colors min-h-[120px] resize-none leading-relaxed",
          className,
        )}
        {...rest}
      />
    </label>
  );
});
