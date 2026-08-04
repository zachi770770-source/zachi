import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

/**
 * בדיקות נגישות אוטומטיות (axe-core) על העמודים המרכזיים, במחשב ובמובייל.
 * תקן: WCAG 2.0/2.1 A + AA. נכשל על הפרות serious/critical.
 */
const ROUTES = ["/", "/book", "/before-relationship", "/preview", "/faq", "/compass", "/waitlist", "/author", "/contact"];

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

for (const route of ROUTES) {
  test(`a11y (desktop): ${route} has no serious/critical axe violations`, async ({ page }) => {
    // ניגודיות נמדדת על המצב היציב: reduced-motion מנטרל אנימציות-כניסה, כך
    // ש-axe לא „תופס” טקסט באמצע fade (opacity חלקי) ומדווח ניגודיות-רגע שקרית.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious,
      serious.map((v) => `${v.id} (${v.impact}) — ${v.nodes.length} node(s)`).join("\n")
    ).toEqual([]);
  });
}

// בדיקה נפרדת בתנועה *רגילה* (ללא reduced-motion): ממתינים שהאנימציות ישתקעו,
// גוללים לחשוף את כל התוכן, ואז axe — כדי לא „להסתתר” מאחורי reduced-motion
// ולתפוס פגמי ניגודיות/נראות קבועים במצב היציב.
for (const route of ["/", "/book", "/preview"]) {
  test(`a11y (normal motion, settled): ${route} has no serious/critical violations`, async ({
    page,
  }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(2600); // הכניסה הקולנועית מסתיימת
    await page.evaluate(async () => {
      for (let y = 0; y <= 9000; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1400); // reveal/build/staged משתקעים
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(
      serious,
      `${route} (settled): ` +
        serious.map((v) => `${v.id} (${v.nodes.length} node(s))`).join("\n")
    ).toEqual([]);
  });
}

test("a11y (mobile 390px): home + preview reader have no serious/critical violations", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const route of ["/", "/preview"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, `${route}: ` + serious.map((v) => v.id).join(", ")).toEqual([]);
  }
  await context.close();
});
