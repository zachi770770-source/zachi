import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

import { CompassConsole } from "@/components/compass/CompassConsole";

/**
 * שורת „על מה שווה לשים לב עכשיו” בממשק השאלה-החופשית:
 * מוצגת *רק* בתשובה מוצלחת שבה השרת החזיר focus; לעולם לא בסירוב/מגבלה/שגיאה,
 * לא כשאין focus, ולא במצב בדיקות. הלקוח לעולם אינו ממציא אותה.
 */

const FOCUS_LABEL = "על מה שווה לשים לב עכשיו";
const FOCUS_TEXT = "פחות סימן בודד, ויותר דפוס עקבי לאורך זמן.";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function mockFetch(post: Record<string, unknown>) {
  const fn = vi.fn((_url: string, init?: RequestInit) =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(
          !init || init.method === "GET" ? { available: true, remaining: 3 } : post,
        ),
    }),
  );
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function ask() {
  const ta = await screen.findByLabelText("כתבו כאן במילים שלכם");
  fireEvent.change(ta, { target: { value: "מה קורה כשהיא מתרחקת לפעמים?" } });
  fireEvent.click(screen.getByRole("button", { name: /שאל את הספר/ }));
}

describe("CompassConsole, attention line (focus)", () => {
  it("renders the attention line after a successful grounded answer that includes focus", async () => {
    mockFetch({ available: true, status: "answered", answer: "תשובה מהספר.", citation: "מבוסס על פרק 4: שקר הכימיה", focus: FOCUS_TEXT, remaining: 2 });
    render(<CompassConsole maxQuestionChars={400} />);
    await ask();
    expect(await screen.findByText("תשובה מהספר.")).toBeInTheDocument();
    expect(screen.getByText(FOCUS_LABEL)).toBeInTheDocument();
    expect(screen.getByText(FOCUS_TEXT)).toBeInTheDocument();
  });

  it("does NOT render the attention line when the answer has no focus field", async () => {
    mockFetch({ available: true, status: "answered", answer: "תשובה בלי פוקוס.", citation: "מבוסס על פרק 2", remaining: 2 });
    render(<CompassConsole maxQuestionChars={400} />);
    await ask();
    expect(await screen.findByText("תשובה בלי פוקוס.")).toBeInTheDocument();
    expect(screen.queryByText(FOCUS_LABEL)).toBeNull();
  });

  it("does NOT render it on a refusal (e.g. off-topic / book-protection block)", async () => {
    mockFetch({ available: true, status: "refused", answer: "השאלה מחוץ למה שהספר עוסק בו." });
    render(<CompassConsole maxQuestionChars={400} />);
    await ask();
    expect(await screen.findByText("השאלה מחוץ למה שהספר עוסק בו.")).toBeInTheDocument();
    expect(screen.queryByText(FOCUS_LABEL)).toBeNull();
  });

  it("does NOT render it on a quota-limit response", async () => {
    mockFetch({ available: true, status: "limit", answer: "הגעתם למכסת השאלות.", remaining: 0 });
    render(<CompassConsole maxQuestionChars={400} />);
    await ask();
    expect(await screen.findByText("הגעתם למכסת השאלות.")).toBeInTheDocument();
    expect(screen.queryByText(FOCUS_LABEL)).toBeNull();
  });

  it("does NOT render it on an error/unknown response", async () => {
    mockFetch({ available: true, status: "weird" });
    render(<CompassConsole maxQuestionChars={400} />);
    await ask();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(FOCUS_LABEL)).toBeNull();
  });

  it("does NOT fabricate it in UI-preview (staging) mode", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    render(<CompassConsole maxQuestionChars={400} uiPreview />);
    const ta = screen.getByLabelText("כתבו כאן במילים שלכם");
    fireEvent.change(ta, { target: { value: "שאלה כלשהי" } });
    fireEvent.click(screen.getByRole("button", { name: /שאל את הספר/ }));
    expect(await screen.findByText("המענה מתוך הספר עדיין בבדיקות.", { exact: true })).toBeInTheDocument();
    expect(screen.queryByText(FOCUS_LABEL)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
