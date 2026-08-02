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
    await page.goto(route, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious,
      serious.map((v) => `${v.id} (${v.impact}) — ${v.nodes.length} node(s)`).join("\n")
    ).toEqual([]);
  });
}

test("a11y (mobile 390px): home + preview reader have no serious/critical violations", async ({
  browser,
}) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const route of ["/", "/preview"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, `${route}: ` + serious.map((v) => v.id).join(", ")).toEqual([]);
  }
  await context.close();
});
