import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

import { CompassConsole } from "@/components/compass/CompassConsole";
import { compass } from "@/content/compass";

/**
 * מצב-בטיחות בלקוח: מציג מסר-בטיחות בלבד.
 *
 * זו גרסה מותאמת של הבדיקה ההיסטורית מ-PR #67. היא נכתבה מול קונסולה שבה הטופס
 * רונדר מיד; מאז (PR #75) התיבה נחשפת רק אחרי שתשובת-הזמינות חוזרת „ready”,
 * ולכן ה-mock חייב לענות גם ל-GET, וההמתנה לתיבה היא אסינכרונית.
 *
 * הדרישות עצמן לא השתנו: מסר-בטיחות נראה, ובלי „על מה שווה לשים לב עכשיו”,
 * בלי ציטוט, בלי CTA לרכישה ובלי מסגור „תשובה מוצלחת”.
 */

const FOCUS_LABEL = "על מה שווה לשים לב עכשיו";
const SAFETY_TEXT = "אם יש עכשיו סכנה מיידית, הדבר החשוב ביותר הוא הבטיחות שלכם.";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

/** GET → זמין (כדי שהטופס ייחשף); POST → התשובה שנבדקת. */
function mockFetch(post: Record<string, unknown>) {
  global.fetch = vi.fn((_url: string, init?: RequestInit) =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(
          !init || init.method === "GET"
            ? { available: true, remaining: 3, limits: { perDay: 3, lifetime: 10, maxQuestionChars: 400 } }
            : post,
        ),
    }),
  ) as unknown as typeof fetch;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function ask(text: string) {
  const box = await screen.findByLabelText(compass.ui.inputLabel);
  fireEvent.change(box, { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: new RegExp(compass.ui.ask) }));
}

describe("CompassConsole, safety response", () => {
  it("renders the safety message and nothing else (no focus, no citation, no purchase CTA)", async () => {
    mockFetch({
      available: true,
      status: "safety",
      category: "immediate_danger",
      severity: "critical",
      answer: SAFETY_TEXT,
    });
    render(<CompassConsole maxQuestionChars={400} />);
    await ask("הוא מאיים עליי עם סכין");

    expect(await screen.findByText(SAFETY_TEXT)).toBeInTheDocument();
    // אין שורת פוקוס.
    expect(screen.queryByText(FOCUS_LABEL)).toBeNull();
    // אין ציטוט מהספר.
    expect(screen.queryByText("מתוך הספר")).toBeNull();
    // אין CTA לרכישה — לא לאמזון ולא לעמוד הספר.
    expect(screen.queryByRole("link", { name: compass.cta.closedLabel })).toBeNull();
    expect(screen.queryByRole("link", { name: compass.cta.openLabel })).toBeNull();
    expect(screen.queryByRole("link", { name: compass.cta.readSampleLabel })).toBeNull();
    // אין מסגור „תשובה מוצלחת”.
    expect(screen.queryByText(compass.afterAnswer)).toBeNull();
  });

  it("announces the safety message to assistive technology", async () => {
    mockFetch({
      available: true,
      status: "safety",
      category: "self_harm",
      severity: "high",
      answer: SAFETY_TEXT,
    });
    render(<CompassConsole maxQuestionChars={400} />);
    await ask("אני רוצה למות");
    // role="alert" — המסר מוכרז מיד ואינו דורש חיפוש בעמוד.
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(SAFETY_TEXT);
  });

  it("keeps the focus line and citation working for a normal answer (regression)", async () => {
    mockFetch({
      available: true,
      status: "answered",
      answer: "תשובה מהספר.",
      citation: "מבוסס על פרק 4: שקר הניצוץ",
      focus: "פחות סימן בודד, ויותר דפוס לאורך זמן.",
      remaining: 2,
    });
    render(<CompassConsole maxQuestionChars={400} />);
    await ask("איך יודעים אם זו התאמה");
    expect(await screen.findByText("תשובה מהספר.")).toBeInTheDocument();
    expect(screen.getByText(FOCUS_LABEL)).toBeInTheDocument();
    expect(screen.getByText("מתוך הספר")).toBeInTheDocument();
  });

  it("never renders an empty result for an unknown future status", async () => {
    // רגרסיה על הנפילה-הבטוחה: לפניה, סטטוס לא-מוכר נתן מסך ריק אחרי „שלח”.
    mockFetch({ available: true, status: "some-future-status", answer: "…" });
    render(<CompassConsole maxQuestionChars={400} />);
    await ask("שאלה רגילה על זוגיות");
    expect(await screen.findByText(compass.ui.genericError)).toBeInTheDocument();
  });
});
