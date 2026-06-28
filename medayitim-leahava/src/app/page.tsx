import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardTitle, CardBody } from "@/components/ui/Card";
import { TOOLS } from "@/lib/tools";

const FEATURED = [
  "fact-story-action",
  "three-gates",
  "maintenance-20",
] as const;

export default function LandingPage() {
  const featureCards = [
    ...TOOLS.filter((t) => (FEATURED as readonly string[]).includes(t.slug)),
    {
      slug: "journal",
      title: "יומן קשר",
      purpose: "מקום אחד לתעד מצבים, תובנות ובחירות לאורך הדרך.",
      href: "/journal",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="text-lg font-bold text-ink-900">מדייטים לאהבה</span>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm text-ink-700 hover:bg-sand-100"
          >
            כניסה
          </Link>
          <LinkButton href="/signup" size="sm">
            הרשמה
          </LinkButton>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold leading-tight text-ink-900 sm:text-5xl">
            מדייטים לאהבה
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-700">
            מערכת עבודה אישית לבניית קשר בריא — מהדייט הראשון ועד אהבה יציבה.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton href="/signup" size="lg">
              להתחיל עכשיו
            </LinkButton>
            <LinkButton href="/tools" size="lg" variant="secondary">
              לראות את הכלים
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Short explanation */}
      <section className="mx-auto max-w-5xl px-4 py-6">
        <Card className="bg-sage-100/60 text-center">
          <p className="text-lg text-ink-800">
            לא עוד טיפים כלליים. כלים מעשיים לחשיבה, בחירה, גבולות, אמון ותיקון.
          </p>
        </Card>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="mb-6 text-center text-2xl font-semibold text-ink-900">
          הכלים המרכזיים
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {featureCards.map((f) => (
            <Card key={f.slug}>
              <CardTitle>{f.title}</CardTitle>
              <CardBody>{f.purpose}</CardBody>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <LinkButton href="/signup" size="lg">
            להתחיל את המסע
          </LinkButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-10 border-t border-sand-200 bg-sand-100/60">
        <div className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-clay-500">
          <p className="font-medium text-ink-700">מדייטים לאהבה</p>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed">
            הכלים כאן נועדו לעזור לחשוב בבהירות ולבחור בבגרות. הם אינם מהווים
            ייעוץ או טיפול פסיכולוגי ואינם תחליף לעזרה מקצועית. במצבים של אלימות,
            פחד, שליטה, השפלה או סכנה — יש לפנות לעזרה מקצועית.
          </p>
          <p className="mt-4 text-xs text-clay-400">
            © {new Date().getFullYear()} מדייטים לאהבה
          </p>
        </div>
      </footer>
    </div>
  );
}
