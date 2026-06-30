"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Quote } from "@/components/ui/Quote";

const SCENARIOS = [
  {
    title: "מוצף באמצע ויכוח",
    description: "הקול עלה. אני מתחיל להגיד דברים שאני אתחרט עליהם.",
    href: "/tools/timeout-with-return",
    tool: "פסק זמן עם חזרה",
  },
  {
    title: "רוצה לשלוח הודעה מתוך דחף",
    description: "האצבע על המסך. הסיפור בראש כבר מוכן.",
    href: "/tools/fact-triangle",
    tool: "משולש העובדה",
  },
  {
    title: "לא יודע אם להישאר או לעזוב",
    description: "משהו לא מסתדר — אבל גם להישאר וגם לעזוב מפחיד.",
    href: "/tools/gate-questions",
    tool: "שלוש שאלות השער",
  },
  {
    title: "מרגיש ריחוק בזוגיות",
    description: "הכול עובד. אבל אני לבד.",
    href: "/tools/twenty-min",
    tool: "תחזוקת ה־20",
  },
  {
    title: "חוזר שוב לאותו מנגנון",
    description: "אותו דבר. אותו תחושה. אותו אדם בכל פעם.",
    href: "/tools/whos-driving",
    tool: "מי אוחז בהגה",
  },
  {
    title: "אחרי פרידה — הדחף לחזור",
    description: "הראש מריץ רק את הטוב. האצבע חזרה לטלפון.",
    href: "/tools/72-hours",
    tool: "נוהל 72 שעות",
  },
];

export default function EmergencyPage() {
  return (
    <main className="animate-fade-in">
      <PageHeader eyebrow="ערכת חירום" title="כשהכול בוער" description="זהו את המצב, לכו לכלי, ועשו דבר אחד עכשיו." />

      <div className="px-5 space-y-3 pb-8">
        {SCENARIOS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="hover:bg-sand-100 transition-colors group cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink-700">{s.title}</p>
                  <p className="text-sm text-ink-500 mt-1">{s.description}</p>
                  <p className="text-xs text-clay-400 mt-2">→ {s.tool}</p>
                </div>
                <ArrowLeft className="size-4 text-ink-300 group-hover:text-ink-500 shrink-0" />
              </div>
            </Card>
          </Link>
        ))}

        <Link href="/safety">
          <Card tone="warm" className="hover:bg-sand-200 transition-colors group cursor-pointer mt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-5 text-accent-400" />
                <div>
                  <p className="font-medium text-ink-700">בטיחות וקבלת עזרה</p>
                  <p className="text-xs text-ink-500 mt-1">אם יש איום, אלימות, שליטה — לא לבד</p>
                </div>
              </div>
              <ArrowLeft className="size-4 text-ink-300" />
            </div>
          </Card>
        </Link>

        <Quote source="נספח א'" className="pt-6">
          אתם לא נכשלתם כשאתם נעזרים בכלי. אתם בני אדם בתוך רגע קשה, ואתם עושים בו את הדבר הנכון —
          עוצרים לפני שפועלים.
        </Quote>
      </div>
    </main>
  );
}
