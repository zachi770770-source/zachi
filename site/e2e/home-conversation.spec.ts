import { test, expect, type Route } from "@playwright/test";

import { homeConversationUi as ui } from "../src/content/homeConversation";
import { homePathUi } from "../src/content/homePaths";
import { focusUi } from "../src/content/focusMode";
import { askUi } from "../src/content/askRoute";
import { JOURNEYS } from "../src/content/journeys";

/**
 * רגע-ההקשבה השיחתי בעמוד הבית — החוזה המלא כשהעוזר זמין, מול /api/compass מדומה
 * (אין צורך בסודות/מסד/מודל אמיתיים לבדיקת ה-UX). וכן: נפילה בחן למסלול המודרך
 * כשלא זמין, ואי-התנגשות עם הבועה הצפה.
 */

/** מדמה /api/compass: GET → זמין; POST → תשובה לפי מספר תורות-המשתמש בהקשר. */
async function mockCompass(route: Route) {
  const req = route.request();
  if (req.method() === "GET") {
    return route.fulfill({ json: { available: true, remaining: 8, limits: {} } });
  }
  const body = JSON.parse(req.postData() || "{}");
  const priorUserTurns = (body.context || []).filter(
    (t: { role: string }) => t.role === "user",
  ).length;
  const turn = priorUserTurns + 1; // 1..3
  if (turn >= 3) {
    return route.fulfill({
      json: {
        available: true,
        status: "answered",
        answer: "דפוס שחוזר לאורך זמן אומר יותר מרגע בודד. שווה לבדוק אותו בשקט.",
        citation: "מבוסס על פרק 4: בחירה מפוכחת",
        // „ערך נמסר” שרת-מחושב — פותח את גשר-הרכישה (בלי סיווג מסע → גשר גנרי).
        valueDelivered: true,
        done: true,
        remaining: 6,
        limits: {},
      },
    });
  }
  return route.fulfill({
    json: {
      available: true,
      status: "answered",
      answer:
        turn === 1
          ? "יכול להיות, אבל ארבע שעות לבדן עדיין לא אומרות את זה."
          : "אם זה חוזר, זה כבר לא רק רגע אחד.",
      citation: "מבוסס על פרק 4: בחירה מפוכחת",
      valueDelivered: true,
      followup:
        turn === 1
          ? "יש עוד משהו שגרם לכם להרגיש שהיא התרחקה?"
          : "מה זה עושה לכם כשזה קורה שוב?",
      done: false,
      remaining: 8 - turn,
      limits: {},
    },
  });
}

async function openSituation(page: import("@playwright/test").Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "אישור הכל" }).click({ timeout: 2500 }).catch(() => {});
  const path = page.locator("#path");
  await path.scrollIntoViewIfNeeded();
  await path.locator('a[href="/before-relationship"]').click();
  // בחירת-מצב פותחת קודם את Focus Mode (עובדה מול סיפור). מפרידים, ואז ה-CTA
  // „המשיכו עם הספר” ממשיך אל השיחה עצמה — שאר הבדיקה עוסקת בשיחה.
  const focus = path.getByRole("region", { name: focusUi.regionLabel });
  await focus.getByRole("button", { name: focusUi.separateLabel }).click();
  await focus.getByRole("button", { name: focusUi.continueLabel }).click();
  return path;
}

test("full conversation: situation → free text → grounded answer → follow-up → answer → synthesis (no navigation)", async ({
  page,
}) => {
  await page.route("**/api/compass", mockCompass);
  const path = await openSituation(page);

  // שלב הפתיחה: הזמנה חופשית לכתיבה במילים שלהם.
  const input = path.getByLabel(ui.invitePrompt);
  await expect(input).toBeVisible();

  // תור 1 — כותבים מצב אמיתי.
  await input.fill("היא לא ענתה לי ארבע שעות, ברור שהיא כבר לא מעוניינת");
  await path.getByRole("button", { name: ui.send }).click();

  await expect(page).toHaveURL(/\/$/); // בלי ניווט
  await expect(path.getByText(/ארבע שעות לבדן עדיין לא אומרות את זה/)).toBeVisible();
  await expect(path.getByText("יש עוד משהו שגרם לכם להרגיש שהיא התרחקה?")).toBeVisible();

  // תור 2 — עונים לשאלת-ההמשך.
  const followup = path.getByLabel(ui.followupEyebrow);
  await expect(followup).toBeFocused();
  await followup.fill("כן, גם ביטלה פגישה פעמיים");
  await path.getByRole("button", { name: ui.followupSend }).click();
  await expect(path.getByText(/זה כבר לא רק רגע אחד/)).toBeVisible();
  await expect(path.getByText("מה זה עושה לכם כשזה קורה שוב?")).toBeVisible();

  // תור 3 (אחרון) — סינתזה קצרה, בלי שאלת-המשך, ואז סגירה.
  const followup2 = path.getByLabel(ui.followupEyebrow);
  await followup2.fill("מרגיש שאני לא באמת נבחר");
  await path.getByRole("button", { name: ui.followupSend }).click();
  await expect(path.getByText(/דפוס שחוזר לאורך זמן/)).toBeVisible();
  // סגירה = גשר עריכתי מהתשובה אל עומק התהליך שבספר, ואז פעולת-המשך ברורה.
  await expect(path.getByText(ui.closingBridge)).toBeVisible();
  const bookCta = path.getByRole("link", { name: ui.closingCtaAria });
  await expect(bookCta).toBeVisible();
  await expect(bookCta).toHaveAttribute("href", /amazon\.com\/dp\/B0GJ3SL9H2/);
  // עדיין ניתן לחזור לחקור — פעולה משנית שקטה, לא מסך חסום.
  await expect(path.getByRole("button", { name: ui.restart })).toBeVisible();

  // אין גלישה אופקית לאורך כל השיחה.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("journey-tailored close: surfaces the mapped tool as a secondary action, Amazon stays primary", async ({
  page,
}) => {
  const journey = JOURNEYS["interpreting-signals"];
  await page.route("**/api/compass", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ json: { available: true, remaining: 8, limits: {} } });
    }
    return route.fulfill({
      json: {
        available: true,
        status: "answered",
        answer: "שווה להפריד בין מה שקרה בפועל למה שהמוח מיהר לספר עליו.",
        citation: "מבוסס על פרק 4: בחירה מפוכחת",
        valueDelivered: true,
        currentSituation: "interpreting-signals",
        toolSurfaced: { slug: "fact-story", path: "/method/fact-story", term: "עובדה, סיפור, פעולה" },
        done: true,
        remaining: 7,
        limits: {},
      },
    });
  });
  const path = await openSituation(page);
  await path.getByLabel(ui.invitePrompt).fill("היא לא ענתה לי ארבע שעות, זה אומר שלא מעוניינת?");
  await path.getByRole("button", { name: ui.send }).click();

  // גשר מותאם-מסע (לא הגנרי).
  await expect(path.getByText(journey.bridge)).toBeVisible();
  await expect(path.getByText(ui.closingBridge)).toHaveCount(0);
  // כלי (מהאחזור) כפעולה משנית — קישור לעמוד-המושג, בלי ניווט אוטומטי ל-/compass.
  const toolLink = path.getByRole("link", { name: `${ui.toolLinkPrefix} עובדה, סיפור, פעולה` });
  await expect(toolLink).toHaveAttribute("href", "/method/fact-story");
  // אמזון נשאר הפעולה הראשית.
  const bookCta = path.getByRole("link", { name: ui.closingCtaAria });
  await expect(bookCta).toBeVisible();
  await expect(bookCta).toHaveAttribute("href", /amazon\./);
});

test("refusal keeps the conversation grounded (no answer without book basis)", async ({ page }) => {
  await page.route("**/api/compass", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ json: { available: true, remaining: 8, limits: {} } });
    }
    return route.fulfill({
      json: {
        available: true,
        status: "refused",
        answer:
          "לא מצאתי בספר בסיס מספיק לתשובה מדויקת על השאלה הזאת. אפשר לנסות לנסח אותה אחרת.",
        remaining: 8,
        limits: {},
      },
    });
  });
  const path = await openSituation(page);
  const input = path.getByLabel(ui.invitePrompt);
  await input.fill("מה מזג האוויר מחר בתל אביב");
  await path.getByRole("button", { name: ui.send }).click();
  await expect(path.getByText(/לא מצאתי בספר בסיס מספיק/)).toBeVisible();
});

test("a safety response closes gently — no purchase CTA on a sensitive moment", async ({
  page,
}) => {
  await page.route("**/api/compass", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ json: { available: true, remaining: 8, limits: {} } });
    }
    return route.fulfill({
      json: {
        available: true,
        status: "safety",
        answer: "אם קשה עכשיו, שווה לדבר עם מישהו שסומכים עליו או עם גורם מקצועי.",
        remaining: 8,
        limits: {},
      },
    });
  });
  const path = await openSituation(page);
  await path.getByLabel(ui.invitePrompt).fill("אני מרגיש שאני לא רוצה להמשיך יותר");
  await path.getByRole("button", { name: ui.send }).click();
  await expect(path.getByText(/שווה לדבר עם מישהו/)).toBeVisible();
  // סגירה שקטה, בלי המרה: אין גשר-ספר ואין קישור-רכישה ברגע רגיש.
  await expect(path.getByText(ui.closingQuiet)).toBeVisible();
  await expect(path.getByText(ui.closingBridge)).toHaveCount(0);
  await expect(path.getByRole("link", { name: ui.closingCtaAria })).toHaveCount(0);
  // עדיין אפשר להתחיל מחדש.
  await expect(path.getByRole("button", { name: ui.restart })).toBeVisible();
});

test("graceful unavailable: falls back to the deterministic guided engine, no dead chat box", async ({
  page,
}) => {
  await page.route("**/api/compass", async (route) =>
    route.fulfill({ json: { available: false, limits: {} } }),
  );
  const path = await openSituation(page);
  // אין תיבת כתיבה חופשית; במקומה המסלול המודרך (AskRoute) עם שאלת-המסגור.
  await expect(
    path.getByRole("heading", { name: askUi.dilemmaTitle }),
  ).toBeVisible();
  await expect(path.getByLabel(ui.invitePrompt)).toHaveCount(0);
});

test("mobile 390: while the inline conversation is open, the floating bubble is hidden", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.route("**/api/compass", mockCompass);
  const path = await openSituation(page);
  await expect(path.getByLabel(ui.invitePrompt)).toBeVisible();
  const bubble = page.locator(".compass-pill");
  await expect(bubble).toHaveCSS("opacity", "0", { timeout: 4000 });
  await expect(bubble).toHaveCSS("pointer-events", "none");
  await ctx.close();
});

test("the deterministic guided path stays reachable from the conversation", async ({ page }) => {
  await page.route("**/api/compass", mockCompass);
  const path = await openSituation(page);
  await expect(path.getByLabel(ui.invitePrompt)).toBeVisible();
  // מעבר מפורש למסלול המודרך — שני המצבים חיים יחד, לא מתחרים.
  await path.getByRole("button", { name: ui.guidedToggleCta }).click();
  await expect(path.getByRole("heading", { name: askUi.dilemmaTitle })).toBeVisible();
  // וחזרה לכתיבה חופשית.
  await path.getByRole("button", { name: ui.backToConversation }).click();
  await expect(path.getByLabel(ui.invitePrompt)).toBeVisible();
  // הבורר עצמו (#path) עדיין מזוהה עם רגע-ההקשבה.
  await expect(path.getByRole("region", { name: homePathUi.conversationLabel })).toBeVisible();
});
