"use client";

import { cn } from "@/lib/cn";

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  labels?: [string, string]; // [low, high]
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 5,
  labels,
  className,
}: SliderProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between gap-2">
        {steps.map((step) => {
          const isActive = step === value;
          return (
            <button
              key={step}
              type="button"
              onClick={() => onChange(step)}
              className={cn(
                "flex-1 h-14 rounded-2xl border-2 font-medium text-base transition-all",
                isActive
                  ? "bg-ink-700 text-sand-50 border-ink-700 scale-105"
                  : "bg-white text-ink-400 border-sand-200 hover:border-ink-300",
              )}
              aria-pressed={isActive}
              aria-label={`דירוג ${step}`}
            >
              {step}
            </button>
          );
        })}
      </div>
      {labels && (
        <div className="flex justify-between mt-3 text-xs text-ink-400">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  );
}
