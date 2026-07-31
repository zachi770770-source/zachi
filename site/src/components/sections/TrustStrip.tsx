import { Container } from "@/components/shared/Container";

/**
 * פס עובדות מרוסן מתחת ל-Hero — עריכתי, לא באנר קידום. שלוש עובדות מאומתות
 * בלבד (3 תחנות, 6 כלים, טעימה חופשית). הפרדה נגישה לקוראי מסך דרך סמנטיקת
 * רשימה (‎<ul>/<li>‎): כל עובדה נמסרת כפריט נפרד; הנקודה המפרידה דקורטיבית
 * (aria-hidden). קומפקטי במובייל (טקסט קטן, נשבר לשורות בעדינות).
 */
const FACTS = [
  "3 תחנות במסע הזוגי",
  "6 כלים מעשיים",
  "טעימה חופשית מהספר",
];

export function TrustStrip() {
  return (
    <section aria-label="עובדות על הספר" className="border-t border-border/60">
      <Container>
        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-3.5 text-center text-[13px] font-medium tracking-[0.01em] text-foreground-muted sm:gap-x-5 sm:py-4 sm:text-[15px]">
          {FACTS.map((fact, i) => (
            <li key={fact} className="flex items-center gap-x-3 sm:gap-x-5">
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className="h-1 w-1 shrink-0 rounded-full bg-brand/70"
                />
              ) : null}
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
