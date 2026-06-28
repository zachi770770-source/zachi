"use client";

import { Button } from "./Button";

interface SaveButtonProps {
  saving: boolean;
  saved?: boolean;
  disabled?: boolean;
  label?: string;
  savingLabel?: string;
  savedLabel?: string;
  type?: "button" | "submit";
  onClick?: () => void;
}

export function SaveButton({
  saving,
  saved = false,
  disabled = false,
  label = "שמירה ביומן",
  savingLabel = "שומר…",
  savedLabel = "נשמר ✓",
  type = "submit",
  onClick,
}: SaveButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || saving}
      size="lg"
    >
      {saving ? savingLabel : saved ? savedLabel : label}
    </Button>
  );
}
