import { test, expect } from "./fixtures";

/**
 * ארבעת עמודי-המסע = ארבע חוויות נפרדות. כל עמוד: H1 ייחודי, intro, נקודות-עומק,
 * טעימה מותאמת (Primary → /preview?tool=&station=), „שאל את הספר” (משני, עם
 * הקשר-המצב), „בחרו מסלול אחר”, ו-*אינו* מציג מחדש את בורר ארבעת המצבים.
 * „אחרי פרידה” בלבד מציע בעדינות „מתחילים מחדש”.
 */

const JOURNEYS = [
  {
    path: "/before-relationship",
    h1: "לפני שבוחרים בן או בת זוג, כדאי להבין איך אתם בוחרים.",
    introBit: "למה דווקא אנשים מסוימים מושכים אותנו",
    depthTitle: "משיכה היא מידע",
    sampleLabel: "קראו את הקטע שמתאים לשלב הזה",
    tool: "fact-story-action",
    station: "before-relationship",
    ask: "dating",
    others: ["/building-relationship", "/inside-relationship", "/after-breakup"],
  },
  {
    path: "/building-relationship",
    h1: "בניית קשר: כשהקשר מתחיל להיות אמיתי, גם השאלות משתנות.",
    introBit: "כימיה יכולה לפתוח את הדלת",
    depthTitle: "קצב הוא חלק מהקשר",
    sampleLabel: "קראו טעימה לקשר שמתחיל",
    tool: "gate-questions",
    station: "building-relationship",
    ask: "building",
    others: ["/before-relationship", "/inside-relationship", "/after-breakup"],
  },
  {
    path: "/inside-relationship",
    h1: "קשר טוב לא נשמר מעצמו. הוא נבנה שוב ושוב.",
    introBit: "ריחוק, שגרה וריבים שחוזרים",
    depthTitle: "מתחת לריב יש בדרך כלל צורך",
    sampleLabel: "קראו טעימה שמתאימה לקשר קיים",
    tool: "twenty-maintenance",
    station: "inside-relationship",
    ask: "existing",
    others: ["/before-relationship", "/inside-relationship", "/after-breakup"],
  },
  {
    path: "/after-breakup",
    h1: "אחרי פרידה: לא צריך לדעת כבר עכשיו מה הצעד הבא.",
    introBit: "פרידה לא מסתיימת ברגע שהקשר נגמר",
    depthTitle: "געגוע אינו הוראה",
    sampleLabel: "קראו טעימה שמתאימה למה שאתם עוברים עכשיו",
    tool: "quiet-check",
    station: "after-breakup",
    ask: "after-breakup",
    others: ["/before-relationship", "/building-relationship", "/inside-relationship"],
  },
] as const;

for (const j of JOURNEYS) {
  test(`${j.path}: unique hero + depth + contextual sample + ask context + no menu re-shown`, async ({
    page,
  }) => {
    const resp = await page.goto(j.path, { waitUntil: "networkidle" });
    expect(resp?.status()).toBeLessThan(400);

    // H1 ייחודי + intro + נקודת-עומק.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(j.h1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByText(j.introBit)).toBeVisible();
    await expect(page.getByText(j.depthTitle).first()).toBeVisible();

    // אזור הפעולות (region עם שם נגיש „להמשך הקריאה”) — כדי לא להתנגש בקישורי
    // ה„שאל את הספר” של הניווט/הפוטר.
    const cta = page.getByRole("region", { name: "להמשך הקריאה" });
    // Primary: טעימה מותאמת → הכלי+התחנה הנכונים, עם תווית ייחודית למסלול.
    await expect(
      cta.getByRole("link", { name: j.sampleLabel }),
    ).toHaveAttribute("href", `/preview?tool=${j.tool}&station=${j.station}`);
    // Secondary: „בדקו מה הספר אומר” עם הקשר-המצב.
    await expect(cta.getByRole("link", { name: "בדקו מה הספר אומר" })).toHaveAttribute(
      "href",
      `/compass?station=${j.ask}`,
    );

    // „בחרו מסלול אחר” → חזרה לבורר בבית (לא בורר מלא בעמוד).
    await expect(page.getByRole("link", { name: /בחרו מסלול אחר/ })).toHaveAttribute(
      "href",
      "/#path",
    );

    // אין הצגה מחדש של ארבעת המצבים: אין קישור לאף אחד משלושת עמודי-המסע האחרים.
    for (const other of j.others) {
      await expect(page.locator(`a[href="${other}"]`)).toHaveCount(0);
    }
  });
}

test("after-breakup gently offers 'starting again' as a next step (not a primary CTA)", async ({ page }) => {
  await page.goto("/after-breakup", { waitUntil: "networkidle" });
  await expect(page.getByText(/סקרנות לחזור לעולם ההיכרויות/)).toBeVisible();
  await expect(page.getByRole("link", { name: "מתחילים מחדש" })).toHaveAttribute(
    "href",
    "/starting-again",
  );
  // הפעולה הראשית נשארת הטעימה — לא „מתחילים מחדש”.
  await expect(
    page.getByRole("link", { name: "קראו טעימה שמתאימה למה שאתם עוברים עכשיו" }),
  ).toBeVisible();
});

test("no horizontal overflow on the journey pages (mobile 390)", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  for (const j of JOURNEYS) {
    await page.goto(j.path, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `overflow on ${j.path}`).toBeLessThanOrEqual(1);
  }
  await ctx.close();
});
