import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Quote } from "@/components/ui/Quote";

export default function NotFound() {
  return (
    <main className="px-5 pt-20 animate-fade-in">
      <p className="text-xs uppercase tracking-widest text-clay-400 font-medium mb-3">
        404
      </p>
      <h1 className="font-serif text-3xl text-ink-700 leading-tight mb-4">
        העמוד הזה לא קיים.
      </h1>
      <p className="text-ink-500 leading-relaxed mb-8">
        אולי הקישור התיישן, או שניסית להגיע למקום שעוד לא בנוי.
        חזור הביתה ונמשיך משם.
      </p>

      <Link href="/">
        <Button size="lg" fullWidth>
          חזרה לבית
        </Button>
      </Link>

      <Quote source="פרק 1" className="mt-12">
        החיפוש נגמר ברגע שמצאתם. הבנייה מתחילה שם.
      </Quote>
    </main>
  );
}
