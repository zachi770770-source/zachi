"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function SafetyStrip() {
  return (
    <div className="fixed bottom-20 left-3 z-30">
      <Link
        href="/emergency"
        className="inline-flex items-center gap-1.5 bg-accent-400 text-sand-50 text-xs font-medium px-3 py-2 rounded-full shadow-lift hover:bg-accent-500 transition-colors"
        aria-label="ערכת חירום"
      >
        <ShieldAlert className="size-3.5" />
        כשהכול בוער
      </Link>
    </div>
  );
}
