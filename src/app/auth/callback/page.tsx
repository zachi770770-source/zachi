"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getCurrentSession } from "@/services/auth/authClient";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthCallbackPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Supabase מטפל ב-hash אוטומטית עם detectSessionInUrl: true (ברירת מחדל).
      // נחכה רגע ואז נבדוק.
      await new Promise((r) => setTimeout(r, 800));
      const session = await getCurrentSession();
      if (!mounted) return;
      if (session.userId) {
        setSession(session);
        router.replace("/");
      } else {
        setError("ההתחברות נכשלה. נסה שוב.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, setSession]);

  return (
    <main className="animate-fade-in flex items-center justify-center min-h-[60vh]">
      <div className="px-5">
        <Card>
          {!error ? (
            <>
              <p className="text-ink-600 mb-2">מאמת חיבור…</p>
              <div className="flex gap-1.5 mt-3">
                <span className="size-2 bg-clay-300 rounded-full animate-pulse" />
                <span
                  className="size-2 bg-clay-300 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="size-2 bg-clay-300 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-accent-500 mb-3">{error}</p>
              <Button onClick={() => router.push("/auth/sign-in")} fullWidth>
                לחזור לכניסה
              </Button>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
