"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Quote } from "@/components/ui/Quote";
import { sendMagicLink, isAuthEnabled } from "@/services/auth/authClient";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("מייל לא תקין");
      return;
    }
    setError(null);
    setSending(true);
    const result = await sendMagicLink(email.trim().toLowerCase());
    setSending(false);
    if (!result.ok) {
      setError(result.error ?? "שגיאה לא ידועה");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <main className="animate-fade-in">
        <PageHeader eyebrow="כניסה" title="קישור נשלח" />
        <div className="px-5 space-y-5">
          <Card tone="highlight">
            <Check className="size-6 text-sage-500 mb-3" />
            <p className="text-ink-700 leading-relaxed">
              שלחנו לך קישור ל-{email}. לחץ עליו בדפדפן הזה כדי להיכנס.
            </p>
            <p className="text-sm text-ink-500 mt-3">
              לא רואה? בדוק תיבת ספאם.
            </p>
          </Card>
          <Button onClick={() => router.push("/")} variant="outline" fullWidth>
            חזרה לבית
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="animate-fade-in">
      <PageHeader
        eyebrow="כניסה אופציונלית"
        title="לשמור את ההתקדמות מעבר למכשיר הזה?"
        description="אתה לא חייב להירשם — אבל אם תרשם, ההתקדמות, האבחונים והשיחות יסונכרנו בענן."
      />

      <div className="px-5 space-y-5">
        {!isAuthEnabled() && (
          <Card tone="warm">
            <p className="text-sm text-ink-600 leading-relaxed">
              Auth עוד לא מופעל. צריך להוסיף NEXT_PUBLIC_SUPABASE_URL
              ו-NEXT_PUBLIC_SUPABASE_ANON_KEY ב-Vercel Environment Variables.
              עד שזה יקרה, האפליקציה עובדת מצוין במצב Guest.
            </p>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="מייל"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
          {error && (
            <p className="text-sm text-accent-500">{error}</p>
          )}
          <Button type="submit" disabled={sending} fullWidth size="lg">
            <Mail className="size-4" />
            {sending ? "שולח…" : "שלח קישור כניסה"}
          </Button>
        </form>

        <Card tone="muted">
          <h3 className="font-medium text-ink-700 mb-2">מה זה משנה?</h3>
          <ul className="text-sm text-ink-500 space-y-1.5">
            <li>• ההתקדמות שלך זמינה מכל מכשיר שתתחבר ממנו</li>
            <li>• המאמן זוכר אותך יותר טוב — אבחונים, דפוסים, כלים שכבר תרגלת</li>
            <li>• פיצ'רים שעוד יבואו (תחזוקת ה־20 לזוגות, שיתוף עם בן זוג) ידרשו חשבון</li>
          </ul>
        </Card>

        <Card tone="muted">
          <h3 className="font-medium text-ink-700 mb-2">פרטיות</h3>
          <p className="text-sm text-ink-500 leading-relaxed">
            אנחנו לא משתמשים במייל שלך לכלום חוץ מכניסה — אין ניוזלטר,
            אין שיתוף עם צד שלישי. הזיכרון שלך מוצפן ב-Supabase, נשמר עם RLS,
            ואתה יכול למחוק הכול בכל עת מ"פרטיות".
          </p>
        </Card>

        <Quote source="עיקרון">
          המאמן זוכר את ההיסטוריה שלך כדי לתת מענה אישי. אתה יכול לבדוק או למחוק את הזיכרון בכל עת.
        </Quote>
      </div>
    </main>
  );
}
