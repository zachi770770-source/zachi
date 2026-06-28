"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="text-center">
      <h2 className="text-lg font-semibold text-ink-900">משהו השתבש</h2>
      <p className="mt-2 text-ink-700">
        אירעה שגיאה בטעינת העמוד. אפשר לנסות שוב.
      </p>
      <div className="mt-5">
        <Button onClick={reset}>נסו שוב</Button>
      </div>
    </Card>
  );
}
