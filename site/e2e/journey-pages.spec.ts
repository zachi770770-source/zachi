import { test, expect } from "./fixtures";
import { journeyPages, type JourneyId } from "../src/content/journeyPages";

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
  {
    path: "/starting-again",
    h1: "מתחילים מחדש: לחזור להיכרויות בלי לחזור לאותה דרך.",
    introBit: "נושאים איתנו פנימה",
    depthTitle: "ניסיון יכול להגן, ויכול לשריין",
    sampleLabel: "קראו טעימה למי שחוזר להיכרויות",
    tool: "boundary-ladder",
    station: "starting-again",
    ask: "dating",
    // „מתחילים מחדש” מפנה ל„לפני קשר” כצעד המשך, ולכן הוא אינו ב-others.
    others: ["/building-relationship", "/inside-relationship", "/after-breakup"],
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

test("before-relationship: the contextual concept link leads to core-values (choosing), while the sample stays fact-story", async ({
  page,
}) => {
  await page.goto("/before-relationship", { waitUntil: "networkidle" });
  // המושג ההקשרי לעומק — „קו אדום מול גמישות” (הבחירה עצמה), לא „עובדה, סיפור, פעולה”.
  const concept = page.getByRole("link", { name: /המושג מהספר/ });
  await expect(concept).toHaveAttribute("href", "/method/core-values");
  await expect(concept).not.toHaveAttribute("href", "/method/fact-story");
  // הטעימה (הפעולה הראשית) נשארת „עובדה, סיפור, פעולה” — לא הושפעה מה-override.
  await expect(
    page.getByRole("link", { name: "קראו את הקטע שמתאים לשלב הזה" }),
  ).toHaveAttribute("href", "/preview?tool=fact-story-action&station=before-relationship");
});

test("building-relationship: the contextual concept link leads to fact-story (interpretation), while the sample stays pace-check", async ({
  page,
}) => {
  await page.goto("/building-relationship", { waitUntil: "networkidle" });
  // המושג ההקשרי לעומק — „עובדה, סיפור, פעולה” (אי-הוודאות/פרשנות), הכלי שכעת ניתן לתרגל.
  const concept = page.getByRole("link", { name: /המושג מהספר/ });
  await expect(concept).toHaveAttribute("href", "/method/fact-story");
  // הטעימה (הפעולה הראשית) נשארת „בדיקת הקצב” (gate-questions) — לא הושפעה מה-override.
  await expect(
    page.getByRole("link", { name: "קראו טעימה לקשר שמתחיל" }),
  ).toHaveAttribute("href", "/preview?tool=gate-questions&station=building-relationship");
});

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

// ── „מה הכי קרוב אליי כרגע?” — כל בחירה מובילה ל-outcome משלה ──────────────────
// לכל אחת מחמש התחנות: אין outcome לפני בחירה; כל אפשרות חושפת שיקוף+שאלה+CTA
// ייחודיים; מעבר בין אפשרויות מחליף את ה-outcome ואינו מוסיף עליו (אין stacking).
for (const id of Object.keys(journeyPages) as JourneyId[]) {
  test(`${id}: each choice reveals its own outcome; switching swaps, never stacks`, async ({
    page,
  }) => {
    const pts = journeyPages[id].depthPoints;
    await page.goto(`/${id}`, { waitUntil: "networkidle" });
    const mirror = page.locator('section[aria-labelledby="depth-heading"]');
    await expect(mirror.getByRole("radio")).toHaveCount(3);

    // 1. אין outcome לפני בחירה — אף CTA של בחירה אינו גלוי.
    for (const p of pts) {
      await expect(
        mirror.getByRole("link", { name: p.outcome.primaryAction.label }),
      ).toBeHidden();
    }

    // 2. בחירת אפשרות 1 → ה-outcome שלה בלבד נחשף, וה-CTA תואם לבחירה.
    await mirror.getByText(pts[0].title, { exact: true }).click();
    await expect(mirror.getByText(pts[0].outcome.question)).toBeVisible();
    const cta1 = mirror.getByRole("link", { name: pts[0].outcome.primaryAction.label });
    await expect(cta1).toBeVisible();
    await expect(cta1).toHaveAttribute("href", pts[0].outcome.primaryAction.href);
    // אין stacking — ה-CTAs של האחרות עדיין מוסתרים.
    await expect(
      mirror.getByRole("link", { name: pts[1].outcome.primaryAction.label }),
    ).toBeHidden();
    await expect(
      mirror.getByRole("link", { name: pts[2].outcome.primaryAction.label }),
    ).toBeHidden();

    // 3. מעבר לאפשרות 2 → ה-reflection/CTA מתחלפים; אפשרות 1 נסגרת (לא מצטבר).
    await mirror.getByText(pts[1].title, { exact: true }).click();
    await expect(
      mirror.getByRole("link", { name: pts[1].outcome.primaryAction.label }),
    ).toBeVisible();
    await expect(mirror.getByText(pts[1].outcome.question)).toBeVisible();
    await expect(cta1).toBeHidden();
    await expect(mirror.getByText(pts[0].outcome.question)).toBeHidden();
    // אפשרות 3 עדיין מוסתרת — בכל רגע גלוי outcome אחד בלבד.
    await expect(
      mirror.getByRole("link", { name: pts[2].outcome.primaryAction.label }),
    ).toBeHidden();
  });
}

test("journey mirror is keyboard-operable (native radio group)", async ({ page }) => {
  const pts = journeyPages["before-relationship"].depthPoints;
  await page.goto("/before-relationship", { waitUntil: "networkidle" });
  const mirror = page.locator('section[aria-labelledby="depth-heading"]');
  // מיקוד הרדיו הראשון ובחירתו במקלדת → ה-outcome הראשון נחשף.
  const radios = mirror.getByRole("radio");
  await radios.first().focus();
  await page.keyboard.press("Space");
  await expect(mirror.getByText(pts[0].outcome.question)).toBeVisible();
  // חץ מטה בקבוצת-רדיו נייטיב מעביר בחירה לאפשרות הבאה.
  await page.keyboard.press("ArrowDown");
  await expect(mirror.getByText(pts[1].outcome.question)).toBeVisible();
  await expect(mirror.getByText(pts[0].outcome.question)).toBeHidden();
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
