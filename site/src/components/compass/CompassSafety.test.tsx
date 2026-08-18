import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

import { CompassConsole } from "@/components/compass/CompassConsole";
import { compass } from "@/content/compass";

/**
 * מצב-בטיחות בלקוח: מציג מסר-בטיחות בלבד. חובה: אין „על מה שווה לשים לב עכשיו”,
 * אין ציטוט, אין CTA לרכישה, אין תשובה „רגילה”, אין כפילות.
 */

const FOCUS_LABEL = "על מה שווה לשים לב עכשיו";
const SAFETY_TEXT = "אם יש עכשיו סכנה מיידית, הדבר החשוב ביותר הוא הבטיחות שלכם.";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function mockFetch(post: Record<string, unknown>) {
  global.fetch = vi.fn((_url: string, init?: RequestInit) =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(
          !init || init.method === "GET" ? { available: true, remaining: 3 } : post,
        ),
    }),
  ) as unknown as typeof fetch;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function ask(text: string) {
  const ta = await screen.findByLabelText("כתבו כאן במילים שלכם");
  fireEvent.change(ta, { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: /שאל את הספר/ }));
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
    render(<CompassConsole salesOpen={false} maxQuestionChars={400} />);
    await ask("הוא מאיים עליי עם סכין");

    expect(await screen.findByText(SAFETY_TEXT)).toBeInTheDocument();
    // אין שורת פוקוס
    expect(screen.queryByText(FOCUS_LABEL)).toBeNull();
    // אין CTA לרכישה
    expect(screen.queryByRole("link", { name: compass.cta.closedLabel })).toBeNull();
    // אין מסגור „תשובה מוצלחת”
    expect(screen.queryByText(compass.afterAnswer)).toBeNull();
    // אין הצעות-פתיחה
    expect(screen.queryByText(compass.freeText.startersLabel)).toBeNull();
  });

  it("keeps the focus line working for a normal answered response (regression)", async () => {
    mockFetch({
      available: true,
      status: "answered",
      answer: "תשובה מהספר.",
      citation: "מבוסס על פרק 4: שקר הכימיה",
      focus: "פחות סימן בודד, ויותר דפוס לאורך זמן.",
      remaining: 2,
    });
    render(<CompassConsole salesOpen={false} maxQuestionChars={400} />);
    await ask("איך יודעים אם זו התאמה");
    expect(await screen.findByText("תשובה מהספר.")).toBeInTheDocument();
    expect(screen.getByText(FOCUS_LABEL)).toBeInTheDocument();
  });
});
