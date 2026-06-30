"use client";

import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import type { ToolField as ToolFieldType } from "@/types";

interface ToolFieldProps {
  field: ToolFieldType;
  value: string | number | undefined;
  onChange: (v: string | number) => void;
}

export function ToolField({ field, value, onChange }: ToolFieldProps) {
  if (field.type === "textarea") {
    return (
      <div>
        <label className="block">
          <span className="block text-base font-medium text-ink-600 mb-1.5">
            {field.label}
          </span>
          {field.helper && (
            <span className="block text-xs text-ink-400 mb-2">{field.helper}</span>
          )}
          <Textarea
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </label>
      </div>
    );
  }

  if (field.type === "input") {
    return (
      <div>
        <label className="block">
          <span className="block text-base font-medium text-ink-600 mb-1.5">
            {field.label}
          </span>
          {field.helper && (
            <span className="block text-xs text-ink-400 mb-2">{field.helper}</span>
          )}
          <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </label>
      </div>
    );
  }

  if (field.type === "slider") {
    return (
      <div>
        <p className="text-base font-medium text-ink-600 mb-1.5">{field.label}</p>
        {field.helper && (
          <p className="text-xs text-ink-400 mb-3">{field.helper}</p>
        )}
        <Slider
          value={Number(value ?? 0)}
          onChange={(v) => onChange(v)}
          min={field.min ?? 1}
          max={field.max ?? 5}
          labels={field.rangeLabels}
        />
      </div>
    );
  }

  if (field.type === "choice") {
    return (
      <div>
        <p className="text-base font-medium text-ink-600 mb-1.5">{field.label}</p>
        {field.helper && (
          <p className="text-xs text-ink-400 mb-3">{field.helper}</p>
        )}
        <div className="space-y-2">
          {field.options?.map((opt) => {
            const isActive = String(value) === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`w-full text-right rounded-2xl border-2 p-4 transition-colors ${
                  isActive
                    ? "border-ink-700 bg-ink-700 text-sand-50"
                    : "border-sand-200 bg-white hover:border-ink-300"
                }`}
              >
                <p className={`text-sm leading-relaxed ${isActive ? "text-sand-50" : "text-ink-600"}`}>
                  {opt.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
