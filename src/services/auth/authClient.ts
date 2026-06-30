"use client";

import { createBrowserClient } from "@/lib/supabase";

/**
 * Auth client (browser-side).
 *
 * הגישה: Guest מותר תמיד. Auth אופציונלי. שום מסך לא חוסם משתמש Guest
 * — חוץ מ-Premium features (ב-Phase 3.4).
 *
 * מצבי שימוש:
 * 1. Magic Link — מגיע במייל, click מחזיר ל-/auth/callback
 * 2. Sign out
 * 3. getSession() — לבדוק אם המשתמש מחובר
 */

interface AuthState {
  userId: string | null;
  email: string | null;
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getCurrentSession(): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { userId: null, email: null };
  try {
    const client = createBrowserClient();
    const { data } = await client.auth.getSession();
    if (!data.session) return { userId: null, email: null };
    return {
      userId: data.session.user.id,
      email: data.session.user.email ?? null,
    };
  } catch {
    return { userId: null, email: null };
  }
}

export async function sendMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Auth עוד לא הופעל. הוסף NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY ב-Vercel.",
    };
  }
  try {
    const client = createBrowserClient();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "שגיאה לא ידועה" };
  }
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const client = createBrowserClient();
    await client.auth.signOut();
  } catch {
    // ignore
  }
}

export function isAuthEnabled(): boolean {
  return isSupabaseConfigured();
}
