import type { ComponentProps } from "react";

interface TextareaProps extends Omit<ComponentProps<"textarea">, "className"> {
  label?: string;
  error?: string;
  hint?: string;
}

const fieldId = (() => {
  let n = 0;
  return () => `textarea-${++n}`;
})();

export function Textarea({ label, error, hint, id, rows = 4, ...props }: TextareaProps) {
  const fid = id ?? fieldId();
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fid} className="text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <textarea
        id={fid}
        rows={rows}
        className={`w-full resize-y rounded-xl border bg-white px-4 py-3 leading-relaxed text-ink-900 placeholder:text-clay-400 focus:border-sage-500 focus:outline-none ${
          error ? "border-red-300" : "border-sand-300"
        }`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-clay-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
