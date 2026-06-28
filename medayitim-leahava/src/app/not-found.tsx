import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold text-ink-900">העמוד לא נמצא</h1>
      <p className="text-ink-700">ייתכן שהקישור שגוי או שהעמוד הוסר.</p>
      <LinkButton href="/dashboard">חזרה לבית</LinkButton>
    </div>
  );
}
