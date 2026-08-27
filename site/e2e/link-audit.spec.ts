import { test, expect, type Page } from "@playwright/test";

/**
 * ביקורת-קישורים כוללת: „שלא יישאר כפתור שנראה פעיל אבל לא עושה כלום”.
 *
 * מכסה את מה שהבדיקות הקיימות עדיין לא: (1) סריקת *כל* ה-<a> בדף הבית
 * (header + main + footer + בר-הטעימה) — כל href חייב להיות יעד אמיתי (מסלול
 * פנימי קיים, או קישור חיצוני אמיתי) ולעולם לא "" / "#" / דף-מת; (2) כל <button>
 * בעל שם-נגישות (אין כפתור-רפאים); (3) הקישורים *בתוך* בועת „שאל את הספר” —
 * הכלי → /book#tool-… והאמזון — פרט ל-CTA לקטע שנבדק ב-compass-launcher.spec;
 * (4) קישורי ה-Footer מגיעים לעמוד אמיתי (H1 קיים); (5) בדיקת-מובייל אמיתית עם
 * צילומי-מסך למסכים המרכזיים.
 */

const AMAZON_ASIN = "B0GJ3SL9H2";

// מקבץ המסלולים הפנימיים הקיימים (app/**/page.tsx). כל href פנימי בדף הבית
// חייב להתמפות לאחד מהם (אחרי הסרת #hash ו-?query). /checkout חסום טרום-השקה
// ולכן לא אמור להיות מקושר מהבית.
const KNOWN_ROUTES = new Set<string>([
  "/",
  "/accessibility",
  "/after-breakup",
  "/author",
  "/before-relationship",
  "/book",
  "/building-relationship",
  "/compass",
  "/contact",
  // עמוד המהדורה האנגלית. נוסף כמסלול אמיתי (app/en/page.tsx) ונשמט מהרשימה
  // הזו, ולכן הביקורת דיווחה עליו כ„מסלול לא מוכר” — כשל בנתוני-הבדיקה, לא
  // קישור מת. עמוד הבית מקשר אליו משלושה מקומות: ההדר, מגירת המובייל
  // ורמיזת-השפה. Playwright אינו חלק משער ה-CI, ולכן הפער נשאר פתוח בשקט.
  "/en",
  "/faq",
  "/inside-relationship",
  "/love",
  "/preview",
  "/privacy",
  // ערכת הכלים הדיגיטלית לקורא (app/reader/page.tsx). מקושר מהפוטר בכל עמוד,
  // מכרטיס-הרכישה ב-/book ומ-/preview.
  "/reader",
  "/shipping-returns",
  "/starting-again",
  "/terms",
  "/thank-you",
]);

async function dismissCookies(page: Page) {
  const accept = page.getByRole("button", { name: "אישור הכל" });
  await accept
    .first()
    .waitFor({ state: "visible", timeout: 3000 })
    .catch(() => {});
  if (await accept.count()) {
    await accept.first().click().catch(() => {});
    await page
      .waitForFunction(() => !document.body.hasAttribute("data-cookie-banner"))
      .catch(() => {});
  }
}

const compass = (page: Page) =>
  page.getByRole("button", { name: /מה הספר אומר על המצב שלי\?, / });

/** מפרק href לבסיס-מסלול פנימי (בלי origin/hash/query), או null לחיצוני. */
function internalPath(href: string, origin: string): string | null {
  let u: URL;
  try {
    u = new URL(href, origin);
  } catch {
    return null;
  }
  if (u.origin !== origin) return null;
  return u.pathname.replace(/\/+$/, "") || "/";
}

test.describe("Home, no dead links or ghost buttons anywhere on the page", () => {
  test("every <a> on the home page points to a real destination (never empty / #)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookies(page);
    const origin = new URL(page.url()).origin;

    const hrefs = await page.locator("a[href]").evaluateAll((els) =>
      els.map((el) => ({
        href: el.getAttribute("href") ?? "",
        text: (el.textContent ?? "").trim().slice(0, 40),
        aria: el.getAttribute("aria-label") ?? "",
      })),
    );
    expect(hrefs.length).toBeGreaterThan(0);

    const dead: string[] = [];
    const unknownInternal: string[] = [];
    for (const a of hrefs) {
      const raw = a.href.trim();
      const label = a.text || a.aria || raw;
      // „מת”: ריק, סתם עוגן ריק, או javascript:void
      if (raw === "" || raw === "#" || raw.startsWith("javascript:")) {
        dead.push(`${label} → "${raw}"`);
        continue;
      }
      // עוגן-בתוך-עמוד (#id) — היעד חייב להתקיים ב-DOM.
      if (raw.startsWith("#")) {
        const id = raw.slice(1);
        const exists =
          !!id && (await page.evaluate((x) => !!document.getElementById(x), id));
        if (!exists) dead.push(`${label} → "${raw}" (no target)`);
        continue;
      }
      // חיצוני (mailto/tel/https אחר) — מתקבל כמו-שהוא (אמיתי, לא מת).
      const path = internalPath(raw, origin);
      if (path === null) continue;
      // פנימי — הבסיס חייב להיות מסלול קיים.
      if (!KNOWN_ROUTES.has(path)) unknownInternal.push(`${label} → ${raw}`);
    }

    expect(dead, `dead links found: ${dead.join(" | ")}`).toEqual([]);
    expect(
      unknownInternal,
      `internal links to unknown routes: ${unknownInternal.join(" | ")}`,
    ).toEqual([]);
  });

  test("every interactive <button> on the home page has an accessible name", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookies(page);

    const nameless = await page
      .locator("button")
      .evaluateAll((els) =>
        els
          .filter((el) => {
            const name =
              (el.getAttribute("aria-label") ?? "").trim() ||
              (el.textContent ?? "").trim() ||
              (el.querySelector("[aria-label]")?.getAttribute("aria-label") ?? "").trim();
            return name.length === 0;
          })
          .map((el) => el.outerHTML.slice(0, 80)),
      );
    expect(nameless, `buttons without an accessible name: ${nameless.join(" | ")}`).toEqual(
      [],
    );
  });
});

test.describe("Assistant bubble, the tool link and the Amazon link both work", () => {
  test("desktop: tool link inside the drawer navigates to /book and reveals that tool; Amazon link is a real external buy", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    // תחנה ידועה מהנתיב → הבועה פותחת ישר בדילמה.
    await page.goto("/before-relationship", { waitUntil: "networkidle" });
    await dismissCookies(page);
    await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
    await compass(page).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("radio", { name: /שחוק.* מאפליקציות ומדייטים/ }).click();
    await expect(dialog.getByRole("article")).toBeVisible();

    // האמזון שבתוך התוצאה — קישור חיצוני אמיתי (href/target/rel), עוד לפני הניווט.
    const amazon = dialog.locator(`a[href*="amazon.com/dp/${AMAZON_ASIN}"]`).first();
    await expect(amazon).toHaveAttribute("target", "_blank");
    await expect(amazon).toHaveAttribute("rel", /noopener/);

    // קישור-הכלי (הכותרת המודגשת) → /book#tool-<id>. הכלי של דילמה זו: boundary-ladder
    // ‏(„קו אדום מול גמישות”).
    const toolLink = dialog.getByRole("link", { name: /קו אדום מול גמישות/ }).first();
    await expect(toolLink).toHaveAttribute("href", /\/book#tool-boundary-ladder$/);
    await toolLink.click();

    // מגיעים ל-/book, ה-drawer נסגר (ה-Overlay לא נשאר), והכלי מודגש/גלוי.
    await page.waitForURL(/\/book(#|$)/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("#tool-boundary-ladder")).toBeVisible();
  });
});

test.describe("Footer, every link resolves to a real page", () => {
  test("desktop: all footer links land on a 200 page with an <h1>", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookies(page);

    const footer = page.getByRole("contentinfo");
    const links = await footer
      .locator("a[href^='/']")
      .evaluateAll((els) =>
        Array.from(new Set(els.map((el) => el.getAttribute("href") ?? ""))).filter(Boolean),
      );
    expect(links.length).toBeGreaterThanOrEqual(9); // main(5) + legal(4) + accessibility

    for (const href of links) {
      const res = await page.goto(href, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `${href} status`).toBeLessThan(400);
      await expect(page.locator("h1").first(), `${href} has an h1`).toBeVisible();
    }
  });
});

test.describe("Real mobile pass, main screens, no overlay eating the CTAs", () => {
  const SCREENS = ["/", "/book", "/preview", "/before-relationship", "/compass"];
  for (const path of SCREENS) {
    test(`mobile 390: ${path} renders with a visible H1 and captures a screenshot`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: "networkidle" });
      await dismissCookies(page);
      await expect(page.locator("h1").first()).toBeVisible();
      const shot = await page.screenshot({ fullPage: true });
      await testInfo.attach(`mobile-390-${path.replace(/\//g, "_") || "home"}`, {
        body: shot,
        contentType: "image/png",
      });
    });
  }

  test("mobile 390: the home primary CTA is on top (elementFromPoint hits its own link)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookies(page);
    // ה-CTA הראשי „קראו טעימה מהספר” — לחיץ בפועל (שום שכבה צפה לא חוסמת אותו).
    const primary = page.getByRole("link", { name: /קראו טעימה מהספר/ }).first();
    await expect(primary).toBeVisible();
    const onTop = await primary.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return el.contains(hit);
    });
    expect(onTop).toBe(true);
  });
});
