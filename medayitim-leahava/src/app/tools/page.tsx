import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { TOOLS } from "@/lib/tools";
import { Card, CardTitle, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

/**
 * Public, read-only tools library. Visitors can browse the tools; opening a
 * tool (/tools/<slug>) requires auth and is enforced by the middleware.
 */
export default async function ToolsLibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      {user ? (
        <Navbar />
      ) : (
        <header className="border-b border-sand-200 bg-sand-50/90">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-ink-900">
              מדייטים לאהבה
            </Link>
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
          </div>
        </header>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">
              ספריית הכלים
            </h1>
            <p className="max-w-2xl text-ink-700">
              כל כלי כאן הוא מסגרת קצרה לחשיבה בהירה ולבחירה בוגרת. בחרו את מה
              שמתאים לרגע שבו אתם נמצאים.
            </p>
            {!user && (
              <p className="text-sm text-clay-500">
                כדי להפעיל כלי ולשמור ביומן צריך חשבון — זה לוקח רגע.
              </p>
            )}
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TOOLS.map((tool) => (
              <Card key={tool.slug} className="flex h-full flex-col">
                <CardTitle>{tool.title}</CardTitle>
                <CardBody>{tool.purpose}</CardBody>
                <div className="mt-auto pt-5">
                  <LinkButton
                    href={user ? tool.href : `/login?redirect=${tool.href}`}
                    fullWidth
                  >
                    להפעיל את הכלי
                  </LinkButton>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
