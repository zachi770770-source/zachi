"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Quote } from "@/components/ui/Quote";
import { Button } from "@/components/ui/Button";

export default function AboutPage() {
  return (
    <main className="animate-fade-in">
      <PageHeader eyebrow="על השיטה" title="מדייטים לאהבה" />

      <div className="px-5 space-y-5 pb-8">
        <Quote source="צחי חן">דייטינג הוא חיפוש; אהבה היא בנייה.</Quote>

        <Card>
          <h3 className="font-medium text-ink-700 mb-3">מהי השיטה</h3>
          <p className="text-ink-500 leading-relaxed">
            ברגע שמשהו מתקרב באמת, הדפוסים הישנים שלנו תופסים את ההגה: ריצוי, בריחה, פחד מקרבה,
            הצורך באישור, הצורך להציל. הספר נותן שפה לזיהוי הדפוסים האלה ומציע כלים מעשיים
            להחזיר את הבחירה לידיים.
          </p>
        </Card>

        <Card>
          <h3 className="font-medium text-ink-700 mb-3">למה אהבה היא בנייה</h3>
          <p className="text-ink-500 leading-relaxed">
            את החצי הראשון של אהבה אנחנו יודעים לעשות: להרגיש משיכה, לקרוא אדם בעשר דקות,
            לסנן ולמדוד. את החצי השני — להישאר נוכחים כשההתלהבות דועכת, להציב גבול בלי לפחד,
            לתקן אחרי שבר — אף אחד לא לימד אותנו. זה החלק שאפשר ללמוד מחדש.
          </p>
        </Card>

        <Card>
          <h3 className="font-medium text-ink-700 mb-3">למי האפליקציה מתאימה</h3>
          <ul className="text-ink-500 leading-relaxed space-y-1.5">
            <li>• רווקים ורווקות שיוצאים לדייטים</li>
            <li>• אנשים בתחילת קשר משמעותי</li>
            <li>• זוגיות ארוכת שנים שמרגישה כצוות תפעול</li>
            <li>• אחרי פרידה או גירושים</li>
            <li>• פרק ב' — עם ילדים והיסטוריה</li>
          </ul>
        </Card>

        <Card tone="warm">
          <h3 className="font-medium text-ink-700 mb-3">מה האפליקציה אינה</h3>
          <p className="text-ink-500 leading-relaxed">
            האפליקציה אינה אפליקציית היכרויות. אינה תחליף לטיפול נפשי, רפואי, משפטי או ייעוץ
            זוגי קליני. אינה כלי לאבחון הפרעות. ואינה ממליצה על פרידה.
          </p>
        </Card>

        <Card>
          <h3 className="font-medium text-ink-700 mb-3">על המחבר</h3>
          <p className="text-ink-500 leading-relaxed">
            צחי חן הוא מאמן ומלווה לזוגיות ולמערכות יחסים. עובד עם יחידים וזוגות בתהליכי בחירה,
            זיהוי דפוסים, תקשורת ובנייה זוגית.
          </p>
        </Card>

        <Link href="/safety">
          <Card tone="warm" className="hover:bg-sand-200 transition-colors group cursor-pointer">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-5 text-accent-400" />
                <div>
                  <p className="font-medium text-ink-700">בטיחות וקבלת עזרה</p>
                  <p className="text-xs text-ink-400">חשוב לקרוא</p>
                </div>
              </div>
            </div>
          </Card>
        </Link>

        <Quote source="פרק 1">
          רוב הכאב במערכות יחסים אינו נובע מכך שהאנשים הלא נכונים מצאו זה את זה, אלא מכך שאנשים
          מסוגלים נכנסים לקשר בלי הכלים שהם צריכים לרגע האמת.
        </Quote>
      </div>
    </main>
  );
}
