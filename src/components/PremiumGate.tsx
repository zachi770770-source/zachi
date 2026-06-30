"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { Feature } from "@/types";
import { hasFeature } from "@/services/entitlements/entitlements";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface PremiumGateProps {
  feature: Feature;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * PremiumGate — wraps a feature.
 * Phase 3: ב-MVP `hasFeature` עדיין מחזיר תמיד true (הכול פתוח).
 * כשתפעיל monetization בעתיד — שינוי בקובץ entitlements.ts בלבד.
 */
export function PremiumGate({ feature, fallback, children }: PremiumGateProps) {
  if (hasFeature(feature)) return <>{children}</>;
  return <>{fallback ?? <DefaultLocked feature={feature} />}</>;
}

function DefaultLocked({ feature }: { feature: Feature }) {
  return (
    <Card tone="warm">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-clay-100 text-clay-500 grid place-items-center shrink-0">
          <Lock className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-ink-700 mb-1">פיצ'ר Premium</p>
          <p className="text-sm text-ink-500 mb-3">
            הפיצ'ר {featureLabel(feature)} זמין רק במסלול Premium.
          </p>
          <Link href="/pricing">
            <Button size="sm">לראות מסלולים</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function featureLabel(f: Feature): string {
  switch (f) {
    case "coach.unlimited":
      return "המאמן ללא הגבלה";
    case "coach.journal":
      return "יומן זוגיות חכם";
    case "tools.advanced":
      return "כלים מתקדמים";
    case "diagnosis.history":
      return "השוואת אבחונים לאורך זמן";
    case "maintenance.partner":
      return "תחזוקת ה־20 עם בן/בת זוג";
    case "learn.all_stations":
      return "כל תחנות הלמידה";
  }
}
