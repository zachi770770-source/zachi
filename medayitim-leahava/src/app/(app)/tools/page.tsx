import { TOOLS } from "@/lib/tools";
import { Card, CardTitle, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export default function ToolsLibraryPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">
          ספריית הכלים
        </h1>
        <p className="max-w-2xl text-ink-700">
          כל כלי כאן הוא מסגרת קצרה לחשיבה בהירה ולבחירה בוגרת. בחרו את מה
          שמתאים לרגע שבו אתם נמצאים.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Card key={tool.slug} className="flex h-full flex-col">
            <CardTitle>{tool.title}</CardTitle>
            <CardBody>{tool.purpose}</CardBody>
            <div className="mt-auto pt-5">
              <LinkButton href={tool.href} fullWidth>
                להפעיל את הכלי
              </LinkButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
