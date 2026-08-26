import { test, expect } from "./fixtures";
import { journeyPages, type JourneyId } from "../src/content/journeyPages";
import { journeyInteractions } from "../src/content/journeyInteractions";

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
    // „לפני קשר” מקשר קדימה אל „מתחילים קשר” (התחנה הבאה) — ולכן הוא אינו
    // ב-others; שאר התחנות עדיין אינן מוצגות (אין בורר-מלא בעמוד).
    others: ["/inside-relationship", "/after-breakup", "/starting-again"],
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
    // „מתחילים קשר” מקשר קדימה אל „בתוך קשר” ואחורה (שקט) אל „לפני קשר” —
    // ולכן שניהם אינם ב-others; שאר התחנות עדיין אינן מוצגות.
    others: ["/after-breakup", "/starting-again"],
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
    // „בתוך קשר” היא תחנה 3 (סוף המסלול): אין „תחנה הבאה”, יש רק קישור-קודם
    // שקט אל „מתחילים קשר” — ולכן הוא אינו ב-others; אין קישור לשאר התחנות.
    others: ["/before-relationship", "/after-breakup", "/starting-again"],
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
    // פעולה משנית *אחת* בלבד באזור הטעימה: קריאת הקטע המותאם (הכלי+התחנה).
    await expect(
      cta.getByRole("link", { name: j.sampleLabel }),
    ).toHaveAttribute("href", `/preview?tool=${j.tool}&station=${j.station}`);
    // „בדקו מה הספר אומר” האינ-ליין הוסר מאזור הטעימה — אין כאן פעולה שנייה
    // שמתחרה. (המצפן הצף/הגלובלי נשאר, ונבדק בספקי ה-compass.)
    await expect(cta.getByRole("link", { name: "בדקו מה הספר אומר" })).toHaveCount(0);

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

test("after-breakup gently offers 'starting again' as a calm option (not a primary CTA)", async ({ page }) => {
  await page.goto("/after-breakup", { waitUntil: "networkidle" });
  // ההצעה הרכה ל„מתחילים מחדש” חיה ב„המשך המסע” (gateway) — אפשרות שקטה,
  // לא band ולא כפתור-דיו. (הכפילות ב„מה כדאי לקרוא מכאן” הוסרה.)
  const next = page.locator('section[aria-labelledby="journey-next-heading"]');
  await expect(next.getByRole("link", { name: /להעיף מבט אל .מתחילים מחדש/ })).toHaveAttribute(
    "href",
    "/starting-again",
  );
  // הטעימה קיימת כפעולה משנית (מתאר), לא כ-CTA ראשי כפוי.
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

// ── PR2: חיזוק תחושת המסע — התקדמות, „התחנה הבאה”, סיום וגשרים ──────────────
// מוכיח את המעברים המרכזיים בלבד (before→building→inside→complete, ושני הגשרים),
// את מחוון-ההתקדמות המתויג, ואת קישור-הכניסה הישיר בכל חמשת העמודים — בלי audit.
const NEXT = 'section[aria-labelledby="journey-next-heading"]';

test("main track shows labeled progress with the current station clearly marked", async ({
  page,
}) => {
  await page.goto("/building-relationship", { waitUntil: "networkidle" });
  const track = page.locator(".journey-progress").first();
  await expect(track).toBeVisible();
  // שלוש התחנות בשמן.
  for (const label of ["לפני קשר", "מתחילים קשר", "בתוך קשר"]) {
    await expect(track).toContainText(label);
  }
  // המצב נמסר בטקסט/סמנטיקה, לא בצבע בלבד: הנוכחית aria-current, הקודמת done.
  await expect(track.locator('[data-state="current"][aria-current="step"]')).toContainText(
    "מתחילים קשר",
  );
  await expect(track.locator('[data-state="done"]')).toContainText("לפני קשר");
});

test("before → building: primary next-station CTA", async ({ page }) => {
  await page.goto("/before-relationship", { waitUntil: "networkidle" });
  const next = page.locator(NEXT);
  await expect(next.getByRole("heading", { name: /התחנה הבאה: מתחילים קשר/ })).toBeVisible();
  await expect(next.getByRole("link", { name: /להמשיך אל .מתחילים קשר/ })).toHaveAttribute(
    "href",
    "/building-relationship",
  );
});

test("building → inside: primary next-station CTA + quiet previous link", async ({ page }) => {
  await page.goto("/building-relationship", { waitUntil: "networkidle" });
  const next = page.locator(NEXT);
  await expect(next.getByRole("heading", { name: /התחנה הבאה: בתוך קשר/ })).toBeVisible();
  await expect(next.getByRole("link", { name: /להמשיך אל .בתוך קשר/ })).toHaveAttribute(
    "href",
    "/inside-relationship",
  );
  // הקודם — קישור משני ושקט בלבד.
  await expect(next.getByRole("link", { name: /חזרה אל .לפני קשר/ })).toHaveAttribute(
    "href",
    "/before-relationship",
  );
});

test("inside is station 3/3: no next-station CTA, has a real completion block", async ({
  page,
}) => {
  await page.goto("/inside-relationship", { waitUntil: "networkidle" });
  const next = page.locator(NEXT);
  await expect(next.getByRole("heading", { name: /סוף המסלול באתר/ })).toBeVisible();
  await expect(next).toContainText("זה לא סוף העבודה הזוגית");
  // אין „התחנה הבאה” ואין תחנה רביעית.
  await expect(next.getByText(/התחנה הבאה/)).toHaveCount(0);
});

test("after-breakup stays a gateway: stay/deepen, and an *optional* move to starting-again", async ({
  page,
}) => {
  await page.goto("/after-breakup", { waitUntil: "networkidle" });
  const next = page.locator(NEXT);
  await expect(next.getByRole("link", { name: /להישאר כאן ולהעמיק/ })).toBeVisible();
  await expect(next.getByRole("link", { name: /להעיף מבט אל .מתחילים מחדש/ })).toHaveAttribute(
    "href",
    "/starting-again",
  );
});

test("starting-again → before-relationship: a bridge back, with experience (not from scratch)", async ({
  page,
}) => {
  await page.goto("/starting-again", { waitUntil: "networkidle" });
  const next = page.locator(NEXT);
  await expect(next.getByRole("heading", { name: /חזרה למסלול: לפני קשר/ })).toBeVisible();
  await expect(next).toContainText("אינה התחלה מאפס");
  await expect(next.getByRole("link", { name: /להמשיך אל .לפני קשר/ })).toHaveAttribute(
    "href",
    "/before-relationship",
  );
});

test("all five journey pages carry the quiet direct-entry link to /#path", async ({ page }) => {
  for (const j of JOURNEYS) {
    await page.goto(j.path, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", { name: /מצאו את המקום שלכם במסע/ }),
      `${j.path} direct-entry link`,
    ).toHaveAttribute("href", "/#path");
  }
});

// ── PR3: פעולה קטנה אחת לכל תחנה — ייחודית, מגיבה, ephemeral, נגישה ──────────
const JI = 'section[aria-labelledby="journey-interaction-heading"]';

for (const id of Object.keys(journeyInteractions) as JourneyId[]) {
  test(`${id}: has its own interaction that responds to the choice and never stacks`, async ({
    page,
  }) => {
    await page.goto(`/${id}`, { waitUntil: "networkidle" });
    const section = page.locator(JI);
    // 1. אינטראקציה ייחודית לתחנה — הכותרת של התחנה עצמה.
    await expect(section.getByRole("heading", { level: 2 })).toHaveText(
      journeyInteractions[id].title,
    );

    const firstItem = section.locator("fieldset.ji-item").first();
    const choices = firstItem.locator(".ji-choice");
    const c0 = choices.nth(0).locator(".ji-reflect");
    const c1 = choices.nth(1).locator(".ji-reflect");

    // 2. אין שיקוף לפני בחירה.
    await expect(c0).toBeHidden();
    await expect(c1).toBeHidden();

    // 3. הפעולה מגיבה לבחירה — סימון חושף את השיקוף של אותה בחירה בלבד.
    await choices.nth(0).locator("label.ji-chip").click();
    await expect(c0).toBeVisible();
    await expect(c1).toBeHidden();

    // מעבר לבחירה אחרת מחליף — לא מצטבר (radio נטיבי).
    await choices.nth(1).locator("label.ji-chip").click();
    await expect(c1).toBeVisible();
    await expect(c0).toBeHidden();

    // 4. אין persistence אחרי reload — ה-state ephemeral (אין localStorage).
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(JI).locator(".ji-reflect").first()).toBeHidden();
  });
}

test("journey interaction is keyboard-operable (native radiogroup)", async ({ page }) => {
  await page.goto("/before-relationship", { waitUntil: "networkidle" });
  const section = page.locator(JI);
  const firstItem = section.locator("fieldset.ji-item").first();
  const choices = firstItem.locator(".ji-choice");
  const radios = firstItem.getByRole("radio");

  // מיקוד הרדיו הראשון ובחירתו במקלדת → השיקוף הראשון נחשף.
  await radios.first().focus();
  await page.keyboard.press("Space");
  await expect(choices.nth(0).locator(".ji-reflect")).toBeVisible();
  // חץ מטה בקבוצת-רדיו נטיב מעביר בחירה לבחירה הבאה (מחליף, לא מצטבר).
  await page.keyboard.press("ArrowDown");
  await expect(choices.nth(1).locator(".ji-reflect")).toBeVisible();
  await expect(choices.nth(0).locator(".ji-reflect")).toBeHidden();
});

test("interaction does not disturb JourneyMirror or the next-station navigation", async ({
  page,
}) => {
  await page.goto("/before-relationship", { waitUntil: "networkidle" });
  // JourneyMirror ממשיך לעבוד — שלוש בחירות בקבוצת-רדיו נפרדת.
  const mirror = page.locator('section[aria-labelledby="depth-heading"]');
  await expect(mirror.getByRole("radio")).toHaveCount(3);
  // ה-next-station של PR #110 עדיין קיים ומצביע לתחנה הבאה.
  await expect(
    page.locator('section[aria-labelledby="journey-next-heading"]').getByRole("link", {
      name: /להמשיך אל .מתחילים קשר/,
    }),
  ).toHaveAttribute("href", "/building-relationship");
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
