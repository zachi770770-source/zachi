import type { ComponentProps } from "react";

interface InputProps extends Omit<ComponentProps<"input">, "className"> {
  label?: string;
  error?: string;
  hint?: string;
}

const fieldId = (() => {
  let n = 0;
  return () => `input-${++n}`;
})();

export function Input({ label, error, hint, id, ...props }: InputProps) {
  const inputId = id ?? fieldId();
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-ink-900 placeholder:text-clay-400 focus:border-sage-500 focus:outline-none ${
          error ? "border-red-300" : "border-sand-300"
        }`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-clay-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
