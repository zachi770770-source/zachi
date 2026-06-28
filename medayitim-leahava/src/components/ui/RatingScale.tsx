"use client";

interface RatingScaleProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}

/**
 * Accessible 1..N rating control rendered as a row of selectable buttons.
 * Works for both 1–5 questionnaire items and 1–10 intensity scales.
 */
export function RatingScale({
  label,
  value,
  onChange,
  min = 1,
  max = 5,
  minLabel,
  maxLabel,
}: RatingScaleProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-ink-800">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {steps.map((step) => {
          const active = value === step;
          return (
            <button
              key={step}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(step)}
              className={`h-10 w-10 rounded-full border text-sm font-medium transition-colors ${
                active
                  ? "border-sage-600 bg-sage-500 text-white"
                  : "border-sand-300 bg-white text-ink-700 hover:border-sage-500"
              }`}
            >
              {step}
            </button>
          );
        })}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-clay-500">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </fieldset>
  );
}
