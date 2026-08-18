import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

/**
 * חוויית /compass הדו-מצבית: שאלה חופשית (ראשי) ⇄ המצפן המודרך (משני), מעבר
 * ברור והפיך. AskRoute ממוקם כדי לבודד את המעבר עצמו (לא את המנוע המודרך).
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/interactive/AskRoute", () => ({
  AskRoute: () => <div data-testid="askroute">מנוע מודרך (מדומה)</div>,
}));

import { CompassExperience } from "@/components/compass/CompassExperience";
import { compass } from "@/content/compass";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderExperience() {
  // uiPreview כדי שהקונסולה לא תיגש לרשת בזמן הבדיקה.
  render(
    <CompassExperience salesOpen={false} maxQuestionChars={300} uiPreview />,
  );
}

describe("CompassExperience, dual-mode free-text ⇄ guided", () => {
  it("shows the free-text experience first (prompt + secondary guided invite)", () => {
    renderExperience();
    expect(
      screen.getByRole("heading", { name: compass.freeText.prompt }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /פתחו את המצפן המודרך/ }),
    ).toBeInTheDocument();
    // המנוע המודרך אינו נטען עד שמבקשים אותו.
    expect(screen.queryByTestId("askroute")).toBeNull();
  });

  it("switches to the guided compass and back, reversibly", async () => {
    renderExperience();
    fireEvent.click(screen.getByRole("button", { name: /פתחו את המצפן המודרך/ }));

    // המנוע המודרך נטען (Suspense), והכותרת המשנית מופיעה.
    expect(await screen.findByTestId("askroute")).toBeInTheDocument();
    expect(screen.getByText(compass.guided.eyebrow)).toBeInTheDocument();

    // חזרה אל השאלה החופשית.
    fireEvent.click(screen.getByRole("button", { name: /חזרה לשאל את הספר/ }));
    expect(
      screen.getByRole("heading", { name: compass.freeText.prompt }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("askroute")).toBeNull();
  });
});
