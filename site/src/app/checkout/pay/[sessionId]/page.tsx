"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ShieldAlert, Loader2 } from "lucide-react";

import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/pricing";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

type SessionInfo = {
  orderId: string;
  orderNumber: string;
  total: number;
  currency: string;
  status: string;
};

export default function MockPaymentPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [info, setInfo] = React.useState<SessionInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`/api/payments/mock/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("not-found");
        return res.json();
      })
      .then(setInfo)
      .catch(() => setError("לא ניתן היה לטעון את פרטי ההזמנה."))
      .finally(() => setLoading(false));
  }, [sessionId]);

  async function simulate(event: "success" | "failed" | "cancelled") {
    if (!info) return;
    setPending(event);
    setError(null);

    try {
      const response = await fetch(`/api/payments/mock/${sessionId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });
      if (!response.ok) throw new Error("failed");

      if (event === "success") {
        trackEvent("payment_success", { order_id: info.orderId });
        trackEvent("purchase", { order_id: info.orderId, value: info.total });
        router.push(`/thank-you?order=${info.orderId}`);
      } else {
        trackEvent("payment_failure", { order_id: info.orderId, reason: event });
        router.push(`/checkout?payment=${event}`);
      }
    } catch {
      setError("הסימולציה נכשלה. נסו שוב.");
      setPending(null);
    }
  }

  // מצב Pre-launch: אין הצגת מסך תשלום/הדגמה באתר הציבורי.
  if (!siteConfig.salesOpen) {
    return (
      <Container className="flex min-h-[60svh] flex-col items-center justify-center py-16 text-center">
        <h1 className="type-h2 text-foreground">המכירה עדיין לא נפתחה</h1>
        <p className="mt-4 max-w-[46ch] text-[18px] leading-relaxed text-foreground-muted">
          האתר בשלב טרום-השקה. עם פתיחת המכירה תתאפשר רכישה מאובטחת.
        </p>
        <Button asChild size="lg" className="mt-6 h-14 px-8 text-[17px]">
          <Link href="/">חזרה לעמוד הבית</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="flex flex-col items-center py-16">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="font-serif text-2xl font-semibold">
          מסך תשלום לדוגמה (Demo)
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          זהו מצב הדגמה בלבד לצורך פיתוח ובדיקה. לא מתבצע כל חיוב אמיתי.
          לחיבור ספק סליקה אמיתי ראו את קובץ ה-README של הפרויקט.
        </p>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" aria-hidden="true" />
          </div>
        ) : info ? (
          <>
            <div className="mt-6 rounded-md bg-surface-muted p-4 text-start">
              <div className="flex justify-between text-sm">
                <span className="text-foreground-muted">מספר הזמנה</span>
                <span className="font-medium">{info.orderNumber}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-foreground-muted">סכום לתשלום</span>
                <span className="font-serif text-lg font-semibold">
                  {formatPrice(info.total, info.currency)}
                </span>
              </div>
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3">
              <Button
                size="lg"
                onClick={() => simulate("success")}
                disabled={pending !== null}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {pending === "success" ? "מעבד..." : "סימולציה: תשלום הצליח"}
              </Button>
              <Button
                variant="outline"
                onClick={() => simulate("failed")}
                disabled={pending !== null}
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
                {pending === "failed" ? "מעבד..." : "סימולציה: תשלום נכשל"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => simulate("cancelled")}
                disabled={pending !== null}
              >
                {pending === "cancelled" ? "מעבד..." : "ביטול תשלום"}
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-6 text-sm text-danger">
            {error ?? "פג תוקף הקישור לתשלום."}
          </p>
        )}
      </div>
    </Container>
  );
}
