"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Quote } from "@/components/ui/Quote";
import { Badge } from "@/components/ui/Badge";
import { track } from "@/services/analytics/providerFactory";

const FREE_FEATURES = [
  "אבחון אישי של 12 שאלות",
  "10 כלים מתוך 15",
  "4 תחנות למידה ראשונות",
  "המאמן — 5 שאלות ביום",
  "ערכת חירום ומסך בטיחות — תמיד פתוחים",
];

const PREMIUM_FEATURES = [
  "כל 15 הכלים",
  "כל 8 תחנות הלמידה + נספח \"בריא\"",
  "המאמן — ללא הגבלה",
  "יומן זוגיות חכם",
  "תוכנית שבועית מתעדכנת",
  "השוואת אבחונים לאורך זמן",
  "תחזוקת ה־20 עם בן/בת זוג (Sync)",
  "תרגול שיחות בכל התרחישים",
];

export default function PricingPage() {
  return (
    <main className="animate-fade-in">
      <PageHeader
        eyebrow="מסלולים"
        title="חינם — או להעמיק"
        description="הספר עצמו ידיד גישה. הכלים החזקים יותר יהיו במסלול Premium כשהוא ייפתח."
      />

      <div className="px-5 space-y-5 pb-8">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-ink-700">Free</p>
              <p className="text-xs text-ink-400">תמיד</p>
            </div>
            <Badge tone="neutral">חינם</Badge>
          </div>
          <ul className="space-y-2 text-sm text-ink-600">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="size-4 text-sage-500 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card tone="highlight">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-ink-700">Premium</p>
              <p className="text-xs text-ink-400">בקרוב</p>
            </div>
            <Badge tone="premium">Premium</Badge>
          </div>
          <ul className="space-y-2 text-sm text-ink-600">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="size-4 text-clay-400 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={() => track("premium_intent_clicked")}
            fullWidth
            size="lg"
            className="mt-5"
          >
            <Lock className="size-4" />
            רוצה לדעת כשזה ייפתח
          </Button>
          <p className="text-xs text-ink-400 text-center mt-2">
            מסלול Premium יהיה זמין אחרי תקופת הטמעה. בינתיים — הכול פתוח לכולם.
          </p>
        </Card>

        <Card tone="muted">
          <h3 className="font-medium text-ink-700 mb-2">מה לעולם לא ייסגר מאחורי תשלום</h3>
          <ul className="text-sm text-ink-500 space-y-1.5">
            <li>• ערכת חירום ("כשהכול בוער")</li>
            <li>• מסך הבטיחות וקבלת עזרה</li>
            <li>• הכלים הבסיסיים: משולש העובדה, מי אוחז בהגה, שלוש שאלות השער</li>
            <li>• האבחון הראשון</li>
          </ul>
          <p className="text-xs text-ink-400 mt-3">
            אהבה, גבולות ובטיחות אינם paywall. זה עיקרון.
          </p>
        </Card>

        <Quote source="צחי חן">
          רוב הכאב במערכות יחסים אינו נובע מכך שהאנשים הלא נכונים מצאו זה את זה,
          אלא מכך שאנשים מסוגלים נכנסים לקשר בלי הכלים שהם צריכים לרגע האמת.
        </Quote>

        <Link href="/">
          <Button variant="outline" fullWidth>
            חזרה לבית
          </Button>
        </Link>
      </div>
    </main>
  );
}
