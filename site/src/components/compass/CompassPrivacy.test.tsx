import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

/**
 * פרטיות: האנליטיקה רשאית לדווח על אירועים אנונימיים (compass_ask /
 * compass_answer_success / compass_refused / compass_limit) — אך *לעולם* אינה
 * כוללת את הטקסט החופשי של המשתמש. הבדיקה מרגלת אחר trackEvent ומוודאת שאף
 * קריאה אינה מכילה את מחרוזת השאלה.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { CompassConsole } from "@/components/compass/CompassConsole";
import { trackEvent } from "@/lib/analytics";

const SECRET = "שאלה-פרטית-שאסור-שתדלוף-12345";

function mockFetch(impl: (url: string, init?: RequestInit) => unknown) {
  const fn = vi.fn((url: string, init?: RequestInit) =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(impl(url, init)) }),
  );
  // @ts-expect-error - מדמים fetch
  global.fetch = fn;
  return fn;
}

beforeEach(() => {
  mockFetch((_url, init) => {
    if (!init || init.method === "GET") return { available: true, remaining: 3 };
    return { available: true, status: "answered", answer: "בנו על יסודות.", remaining: 2 };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CompassConsole, analytics privacy", () => {
  it("fires anonymous events but never puts the question text into any analytics call", async () => {
    render(<CompassConsole maxQuestionChars={400} />);
    const textarea = await screen.findByLabelText("כתבו כאן במילים שלכם");
    fireEvent.change(textarea, { target: { value: SECRET } });
    fireEvent.click(screen.getByRole("button", { name: /שאל את הספר/ }));

    await screen.findByText("בנו על יסודות.");

    const calls = (trackEvent as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    // אירועים אנונימיים נורים.
    expect(calls.some((c) => c[0] === "compass_ask")).toBe(true);
    expect(calls.some((c) => c[0] === "compass_answer_success")).toBe(true);
    // אף קריאה אינה מכילה את טקסט השאלה — בשם האירוע או במטען.
    for (const c of calls) {
      expect(JSON.stringify(c)).not.toContain(SECRET);
    }
  });
});
