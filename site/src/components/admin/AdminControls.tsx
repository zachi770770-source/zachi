"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

/** טופס כניסה לאדמין — בודק את סוד-השרת ומקבל עוגיית-סשן. */
export function AdminLogin() {
  const [state, setState] = React.useState<"idle" | "submitting" | "error">("idle");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setState("submitting");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      setState("error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-3xl border border-border bg-surface p-8">
      <h1 className="font-serif text-[1.5rem] font-bold text-foreground">לוח הבקרה</h1>
      <p className="mt-1 text-[13px] text-foreground-muted">אזור ניהולי מוגן. יש להזין את סיסמת האדמין.</p>
      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
        <label htmlFor="admin-pw" className="text-[13px] font-semibold text-foreground">
          סיסמת אדמין
        </label>
        <input
          id="admin-pw"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-[15px] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
        {state === "error" ? (
          <p role="alert" className="text-[13px] font-medium text-[var(--color-brand-hover)]">
            סיסמה שגויה או שהכניסה אינה זמינה.
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={state === "submitting"}>
          {state === "submitting" ? "נכנס…" : "כניסה"}
        </Button>
      </form>
    </div>
  );
}

export function AdminLogout() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
        router.refresh();
      }}
      className="text-[13px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      יציאה
    </button>
  );
}

const RANGES: { key: string; label: string }[] = [
  { key: "today", label: "היום" },
  { key: "7d", label: "7 ימים" },
  { key: "30d", label: "30 ימים" },
];

export function RangePicker({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [customOpen, setCustomOpen] = React.useState(current === "custom");

  const go = (range: string, extra?: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    next.set("range", range);
    if (extra) for (const [k, v] of Object.entries(extra)) next.set(k, v);
    else {
      next.delete("from");
      next.delete("to");
    }
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => go(r.key)}
          className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
            current === r.key
              ? "bg-foreground text-surface"
              : "border border-border bg-surface text-foreground-muted hover:text-foreground"
          }`}
        >
          {r.label}
        </button>
      ))}
      <button
        onClick={() => setCustomOpen((v) => !v)}
        className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          current === "custom" ? "bg-foreground text-surface" : "border border-border bg-surface text-foreground-muted hover:text-foreground"
        }`}
      >
        טווח מותאם
      </button>
      {customOpen ? (
        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const from = String(fd.get("from") ?? "");
            const to = String(fd.get("to") ?? "");
            if (from && to) go("custom", { from, to });
          }}
        >
          <input name="from" type="date" required aria-label="מתאריך" className="rounded-lg border border-border-strong bg-surface px-2 py-1 text-[13px] text-foreground" />
          <input name="to" type="date" required aria-label="עד תאריך" className="rounded-lg border border-border-strong bg-surface px-2 py-1 text-[13px] text-foreground" />
          <Button type="submit" size="sm">החל</Button>
        </form>
      ) : null}
    </div>
  );
}
