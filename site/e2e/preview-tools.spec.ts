import { test, expect } from "./fixtures";

/**
 * טעימה מותאמת-כלי: לכל כלי תקף הקטע נבנה *כולו* מהתוכן המאושר של אותו כלי
 * (תרחיש→פתיחה, יישום→גוף, תובנה→משפט-מפתח, שאלה→הרהור סוגר). מוכיחים ששישה
 * כלים מפיקים שישה גופי-קריאה שונים באמת, ואף אחד אינו הגוף הכללי.
 */

const TOOL_IDS = [
  "quiet-check",
  "fact-story-action",
  "gate-questions",
  "boundary-ladder",
  "twenty-maintenance",
  "emergency-kit",
];

// משפט-עוגן מהטעימה הכללית — אסור שיופיע בקטע מותאם-כלי.
const GENERIC_MARKER = "לא כל אדם מתאים לנו";

test("all six tools resolve to a genuinely different reading body (none is the generic body)", async ({
  page,
}) => {
  const bodies: Record<string, string> = {};
  for (const id of TOOL_IDS) {
    await page.goto(`/preview?tool=${id}&station=before-relationship`, {
      waitUntil: "networkidle",
    });
    const body = (await page.locator(".living-ink").first().innerText()).trim();
    expect(body.length, `reading body for ${id} should be non-trivial`).toBeGreaterThan(40);
    expect(body, `${id} must not fall back to the generic body`).not.toContain(GENERIC_MARKER);
    bodies[id] = body;
  }
  // כל שישה הגופים ייחודיים זה מזה.
  const values = Object.values(bodies);
  const unique = new Set(values);
  expect(unique.size, "no two tools may share the same reading body").toBe(TOOL_IDS.length);
});

test("quiet-check opens with its approved scenario, and its question is the closing reflection", async ({
  page,
}) => {
  await page.goto("/preview?tool=quiet-check&station=before-relationship", {
    waitUntil: "networkidle",
  });
  await expect(page.locator(".reader-context")).toContainText("בדיקת השקט");
  await expect(page.locator(".reader-lead")).toContainText("שלחת הודעה ב-14:00");
  await expect(page.locator(".reader-principle")).toContainText(
    "שקט הוא לא בהכרח דחייה",
  );
  // השאלה של הכלי היא ההרהור הסוגר (לא באמצע הקריאה).
  await expect(page.locator(".reader-closing__prompt")).toContainText(
    "מה עושים כשפתאום יש שקט מהצד השני?",
  );
});

test("no valid tool → the general approved sample (generic body present)", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  await expect(page.locator(".living-ink").first()).toContainText(GENERIC_MARKER);
  await expect(page.locator(".reader-context")).toHaveCount(0);
});

test("invalid tool query falls back safely to the general sample", async ({ page }) => {
  await page.goto("/preview?tool=does-not-exist&station=before-relationship", {
    waitUntil: "networkidle",
  });
  await expect(page.locator(".living-ink").first()).toContainText(GENERIC_MARKER);
  await expect(page.locator(".reader-context")).toHaveCount(0);
});
