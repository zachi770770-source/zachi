import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

import { CompassConsole } from "@/components/compass/CompassConsole";
import { compass } from "@/content/compass";
import { COMPASS_INSUFFICIENT_ANSWER } from "@/lib/compass/assistant/config";

/**
 * סירוב בלקוח: הנוסח המאושר בלבד.
 *
 * המקבילה של בדיקת-הבטיחות, עבור המצב השני שאסור לו לקבל מסגור של „תשובה
 * מוצלחת”. השרת כבר מבטיח זאת מבנית (טיפוס `refused` אינו נושא ציטוט או
 * שורת-פוקוס), אבל בלי בדיקה כאן די בהוספת שדה אחד לענף הרינדור כדי לצרף
 * לסירוב „מבוסס על פרק N” או CTA לרכישה, בלי שאיש ישים לב.
 */

const FOCUS_LABEL = "על מה שווה לשים לב עכשיו";

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

describe("CompassConsole, refusal response", () => {
  it("renders the approved refusal and nothing else (no focus, no citation, no purchase CTA)", async () => {
    mockFetch({
      available: true,
      status: "refused",
      answer: COMPASS_INSUFFICIENT_ANSWER,
      remaining: 2,
    });
    render(<CompassConsole maxQuestionChars={400} />);
    await ask("מה הריבית על משכנתה היום?");

    expect(await screen.findByText(COMPASS_INSUFFICIENT_ANSWER)).toBeInTheDocument();
    expect(screen.queryByText(FOCUS_LABEL)).toBeNull();
    expect(screen.queryByText("מתוך הספר")).toBeNull();
    expect(screen.queryByRole("link", { name: compass.cta.closedLabel })).toBeNull();
    expect(screen.queryByRole("link", { name: compass.cta.openLabel })).toBeNull();
    expect(screen.queryByRole("link", { name: compass.cta.readSampleLabel })).toBeNull();
    expect(screen.queryByText(compass.afterAnswer)).toBeNull();
  });

  it("ignores a citation or focus field if a future server ever sent one with a refusal", async () => {
    // הגנה בעומק: גם אם השרת ישלח שדות עודפים, ענף-הסירוב אינו מרנדר אותם.
    mockFetch({
      available: true,
      status: "refused",
      answer: COMPASS_INSUFFICIENT_ANSWER,
      citation: "מבוסס על פרק 4: שקר הניצוץ",
      focus: "שווה לשים לב לדפוס לאורך זמן.",
      remaining: 2,
    });
    render(<CompassConsole maxQuestionChars={400} />);
    await ask("איך מכינים חומוס ביתי?");

    expect(await screen.findByText(COMPASS_INSUFFICIENT_ANSWER)).toBeInTheDocument();
    expect(screen.queryByText("מתוך הספר")).toBeNull();
    expect(screen.queryByText(/מבוסס על פרק/)).toBeNull();
    expect(screen.queryByText(FOCUS_LABEL)).toBeNull();
    expect(screen.queryByText("שווה לשים לב לדפוס לאורך זמן.")).toBeNull();
  });
});
