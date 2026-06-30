"use client";

import type { ReactNode } from "react";
import type { Feature } from "@/types";
import { hasFeature } from "@/services/entitlements/entitlements";

interface PremiumGateProps {
  feature: Feature;
  fallback?: ReactNode;
  children: ReactNode;
}

// ב־MVP מחזיר תמיד את הילדים. ב־Phase 2 נחבר ל־billing אמיתי.
export function PremiumGate({ feature, fallback, children }: PremiumGateProps) {
  if (hasFeature(feature)) return <>{children}</>;
  return <>{fallback ?? null}</>;
}
