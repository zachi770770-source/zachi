"use client";

import { useEffect } from "react";
import { getCurrentSession, isAuthEnabled } from "@/services/auth/authClient";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * AuthSync — Wrapper שלא רנדר כלום, רק טוען את ה-session ב-mount.
 * אם Supabase לא מוגדר — מסמן ready ולא קורא לרשת.
 */
export function AuthSync() {
  const { setSession, setReady } = useAuthStore();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isAuthEnabled()) {
        setReady(true);
        return;
      }
      const session = await getCurrentSession();
      if (!mounted) return;
      setSession(session);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [setSession, setReady]);

  return null;
}
