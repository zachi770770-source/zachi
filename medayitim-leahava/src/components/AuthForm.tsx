"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeRedirect } from "@/lib/redirect";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Mode = "login" | "signup";

/** Reads and sanitises the ?redirect param at submit time (client-only). */
function resolveRedirect(): string {
  if (typeof window === "undefined") return "/dashboard";
  const param = new URLSearchParams(window.location.search).get("redirect");
  return safeRedirect(param);
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isSignup = mode === "signup";

  // Surface the ?error=auth notice sent by the auth callback on failure.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("error");
    if (param === "auth") {
      setError("אישור ההתחברות נכשל. נסו להתחבר שוב.");
    }
  }, []);

  function validate(): string | null {
    if (isSignup && fullName.trim().length < 2) {
      return "יש להזין שם מלא.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "כתובת אימייל לא תקינה.";
    }
    if (password.length < 6) {
      return "הסיסמה צריכה להכיל לפחות 6 תווים.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        // Route the email-confirmation link through /auth/callback, carrying
        // the (already-sanitised) intended destination as ?next=.
        const next = encodeURIComponent(resolveRedirect());
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=${next}`;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo,
          },
        });
        if (signUpError) throw signUpError;

        // If email confirmation is required there is no active session yet.
        if (!data.session) {
          setInfo(
            "נשלח אליך אימייל לאישור הכתובת. לאחר האישור אפשר להתחבר.",
          );
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push(resolveRedirect());
      router.refresh();
    } catch (err) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <Link href="/" className="text-xl font-bold text-ink-900">
          מדייטים לאהבה
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-ink-900">
          {isSignup ? "יצירת חשבון" : "כניסה לחשבון"}
        </h1>
        <p className="mt-1 text-sm text-clay-500">
          {isSignup
            ? "כמה פרטים קצרים כדי להתחיל את המסע."
            : "טוב לראות אותך שוב."}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {isSignup && (
            <Input
              label="שם מלא"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="איך לקרוא לך?"
              required
            />
          )}
          <Input
            label="אימייל"
            type="email"
            autoComplete="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
          <Input
            label="סיסמה"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="לפחות 6 תווים"
            required
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg bg-sage-100 px-3 py-2 text-sm text-sage-600">
              {info}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading
              ? "רגע…"
              : isSignup
                ? "יצירת חשבון"
                : "כניסה"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-ink-700">
        {isSignup ? "כבר יש לך חשבון? " : "אין לך עדיין חשבון? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-clay-600 hover:underline"
        >
          {isSignup ? "כניסה" : "הרשמה"}
        </Link>
      </p>
    </div>
  );
}

function translateAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/Invalid login credentials/i.test(message)) {
    return "אימייל או סיסמה שגויים.";
  }
  if (/User already registered/i.test(message)) {
    return "כתובת האימייל כבר רשומה. אפשר להתחבר.";
  }
  if (/Email not confirmed/i.test(message)) {
    return "יש לאשר את כתובת האימייל לפני הכניסה.";
  }
  return "אירעה שגיאה. נסו שוב בעוד רגע.";
}
