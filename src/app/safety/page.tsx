"use client";

import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export default function SafetyPage() {
  return (
    <main className="animate-fade-in">
      <PageHeader eyebrow="חשוב" title="בטיחות וקבלת עזרה" />

      <div className="px-5 space-y-5 pb-8">
        <Card tone="warm">
          <ShieldAlert className="size-6 text-accent-400 mb-3" />
          <p className="text-ink-700 leading-relaxed">
            האפליקציה הזאת נועדה למטרות חינוכיות ומידע בלבד. היא אינה תחליף לטיפול מקצועי,
            ייעוץ רפואי, משפטי או נפשי.
          </p>
        </Card>

        <Card>
          <h3 className="font-medium text-ink-700 mb-3">מתי לפנות לעזרה</h3>
          <p className="text-ink-500 leading-relaxed mb-3">
            אם אתם נמצאים במצב שיש בו:
          </p>
          <ul className="text-ink-500 leading-relaxed space-y-1.5">
            <li>• איומים, אלימות פיזית או מילולית</li>
            <li>• כפייה, מעקב, בידוד או שליטה</li>
            <li>• השפלה חוזרת או הפחדה</li>
            <li>• לחץ מיני, רגשי או כלכלי</li>
            <li>• חששות לפגיעה עצמית או בזולת</li>
          </ul>
          <p className="text-ink-700 leading-relaxed mt-4 font-medium">
            אל תישארו עם זה לבד. פנו לעזרה.
          </p>
        </Card>

        <Card>
          <h3 className="font-medium text-ink-700 mb-3">למי לפנות</h3>
          <ul className="text-ink-500 leading-relaxed space-y-2">
            <li>• אדם בטוח שאתם סומכים עליו</li>
            <li>• רופא משפחה או קופת חולים</li>
            <li>• שירותי הרווחה</li>
            <li>• מרכז סיוע מוכר באזורכם</li>
            <li>• איש מקצוע מוסמך בבריאות הנפש</li>
          </ul>
        </Card>

        <Card tone="muted">
          <p className="text-sm text-ink-500 leading-relaxed">
            הכלים שבאפליקציה נועדו לתמוך באנשים בקשרים בריאים. הם אינם מיועדים לאבחן, לטפל, או
            להחליף הנחיה של איש מקצוע מוסמך.
          </p>
        </Card>
      </div>
    </main>
  );
}
