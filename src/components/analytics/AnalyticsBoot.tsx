"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track, identify } from "@/services/analytics/providerFactory";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * AnalyticsBoot — אתחול אנליטיקה + מעקב מסכים.
 * רק אם המשתמש אישר אנליטיקה ב-onboarding.
 */
export function AnalyticsBoot() {
  const consent = useAppStore((s) => s.analyticsConsent);
  const userId = useAuthStore((s) => s.userId);
  const pathname = usePathname();

  useEffect(() => {
    if (!consent) return;
    track("app_opened", { path: pathname });
  }, [consent, pathname]);

  useEffect(() => {
    if (!consent) return;
    if (userId) identify({ userId });
  }, [consent, userId]);

  useEffect(() => {
    if (!consent) return;
    track("screen_viewed" as never, { path: pathname });
  }, [consent, pathname]);

  return null;
}
