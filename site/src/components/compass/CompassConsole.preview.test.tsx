import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

import { CompassConsole } from "@/components/compass/CompassConsole";
import { compass } from "@/content/compass";

/**
 * מצב בדיקות (Preview/Staging): הטופס נראה וניתן לבדיקה, אך *אינו* מפיק מענה.
 * הכלל הקריטי: אין קריאת רשת ואין המצאת תשובה — השליחה נעצרת בהודעה מרוסנת.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CompassConsole, UI-preview (staging) mode", () => {
  it("renders the textarea and a restrained preview notice, with no network call", () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    render(<CompassConsole salesOpen={false} maxQuestionChars={300} uiPreview />);

    // הטופס זמין מיד (בלי GET), והודעת מצב-הבדיקות מוצגת.
    expect(screen.getByLabelText("כתבו כאן במילים שלכם")).toBeInTheDocument();
    expect(screen.getByText(compass.freeText.preview.notice)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("intercepts submit safely: shows the restrained message, never calls the API, never fabricates an answer", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    render(<CompassConsole salesOpen={false} maxQuestionChars={300} uiPreview />);
    const textarea = screen.getByLabelText("כתבו כאן במילים שלכם");
    fireEvent.change(textarea, { target: { value: "האם כדאי להמשיך את הקשר?" } });
    fireEvent.click(screen.getByRole("button", { name: /שאל את הספר/ }));

    // ההודעה המרוסנת מופיעה — ואין תשובה מומצאת ואין קריאת רשת.
    expect(await screen.findByText(compass.freeText.preview.answer)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    // אין מסגור-המרה של „תשובה מוצלחת”.
    expect(screen.queryByText(compass.afterAnswer)).toBeNull();
  });
});
