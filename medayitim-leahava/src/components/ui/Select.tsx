import type { ComponentProps } from "react";

interface SelectProps extends Omit<ComponentProps<"select">, "className"> {
  label?: string;
  error?: string;
  options: readonly string[];
  placeholder?: string;
}

const fieldId = (() => {
  let n = 0;
  return () => `select-${++n}`;
})();

export function Select({
  label,
  error,
  options,
  placeholder,
  id,
  ...props
}: SelectProps) {
  const sid = id ?? fieldId();
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={sid} className="text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <select
        id={sid}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-ink-900 focus:border-sage-500 focus:outline-none ${
          error ? "border-red-300" : "border-sand-300"
        }`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
