import Link from "next/link";

import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { faqItems } from "@/content/faq";
import { Container } from "@/components/shared/Container";
import { Faq } from "@/components/faq/Faq";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata = pageMetadata({
  title: "שאלות נפוצות",
  // התיאור הקודם הבטיח „משלוח” — הספר הוא Kindle ואין משלוח. הנוסח כאן מונה
  // את מה שהעמוד באמת עונה עליו, ולכן הוא גם ארוך מספיק לתצוגה בתוצאות.
  description: `שאלות נפוצות על „${siteConfig.bookTitle}”: למי הספר מתאים ולמי פחות, מה מקבלים ברכישה, באילו מכשירים אפשר לקרוא, וביטולים והחזרים.`,
  path: "/faq",
});

export default function FaqPage() {
  return (
    <Container className="py-10 sm:py-16">
      <FaqSchema />
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "שאלות נפוצות", path: "/faq" },
        ]}
      />
      {/* ה-Hero (מ-PR #45) נשמר כפי שאושר, בעמודת max-w-2xl. גוף השאלות מקבל
          עמודה מעט רחבה יותר כדי לתת מקום לשוליים העריכתיים ולנשימה בין השאלות. */}
      <div className="mx-auto mt-6 max-w-2xl">
        <span className="kicker">על הספר</span>
        <h1 className="mt-4 font-serif type-hero text-foreground">
          שאלות נפוצות
        </h1>
        <p className="mt-5 text-lg text-foreground-muted">
          כל מה שכדאי לדעת על הספר לפני שקוראים.
        </p>
        <p className="mt-2 text-[14px] italic text-foreground-muted">
          אין תשובה אחת שמתאימה לכולם.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-[44rem] sm:mt-12">
        <Faq items={faqItems} />
      </div>

      {/* עד כאן העמוד היה קצה-מסלול: אפס קישורים יוצאים. מי ששאל „למי הספר
          מתאים?” ולא השתכנע, נשאר בלי צעד הבא — והשאלות שהוא באמת שואל
          (דייטים שנתקעים, מה מחזיק קשר) כבר נענות באתר במקום אחר. זה אינו
          מקטע-SEO: זו התשובה לשאלה שנשארה פתוחה בתחתית עמוד השאלות. */}
      <section
        aria-labelledby="faq-next"
        className="mx-auto mt-14 max-w-2xl border-t border-border pt-9 sm:mt-16 sm:pt-11"
      >
        <h2 id="faq-next" className="font-serif text-[1.45rem] font-semibold text-foreground">
          לא מצאתם כאן תשובה?
        </h2>
        <p className="mt-3.5 text-[1.03rem] leading-[1.9] text-foreground-muted">
          חלק מהשאלות אינן על הספר אלא על מה שקורה בדרך עצמה. לאלה יש באתר תשובות
          מלאות, בלי לקנות כלום:
        </p>
        <ul className="mt-5 list-none space-y-3 ps-0">
          {[
            { href: "/dating", label: "מה באמת קורה בשלב הדייטים", sub: "למה סדרת פגישות נעצרת, ואיך עוברים מדייטים לקשר." },
            { href: "/love", label: "מהי אהבה ואיך היא נבנית", sub: "במה אהבה שונה מהתאהבות, ומה מחזיק קשר לאורך זמן." },
            { href: "/guide", label: "כל המדריכים, לפי שלבי המסע", sub: "מהדייטים הראשונים ועד זוגיות ארוכה." },
          ].map((item) => (
            <li key={item.href} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-[0.65rem] h-[5px] w-[5px] shrink-0 rounded-full bg-brand"
              />
              <span>
                <Link
                  href={item.href}
                  className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  {item.label}
                </Link>
                <span className="block text-[0.95rem] leading-[1.7] text-foreground-muted">
                  {item.sub}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[0.95rem] leading-[1.8] text-foreground-muted">
          ואם השאלה היא על הרכישה עצמה,{" "}
          <Link
            href="/contact"
            className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            אפשר לכתוב לנו
          </Link>
          .
        </p>
      </section>
    </Container>
  );
}
