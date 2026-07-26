import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Faq } from "@/components/faq/Faq";

const items = [
  { id: "q1", question: "שאלה ראשונה?", answer: "תשובה ראשונה." },
  { id: "q2", question: "שאלה שנייה?", answer: "תשובה שנייה." },
];

describe("Faq", () => {
  it("renders every question and keeps answers in the DOM (crawlable, no-JS)", () => {
    render(<Faq items={items} />);
    expect(screen.getByText("שאלה ראשונה?")).toBeInTheDocument();
    expect(screen.getByText("שאלה שנייה?")).toBeInTheDocument();
    // התשובות נמצאות ב-HTML גם לפני פתיחה — נגישות וסריקה גם ללא JavaScript.
    expect(screen.getByText("תשובה ראשונה.")).toBeInTheDocument();
    expect(screen.getByText("תשובה שנייה.")).toBeInTheDocument();
  });

  it("opens a question via the native details/summary toggle", async () => {
    const user = userEvent.setup();
    const { container } = render(<Faq items={items} />);
    const details = container.querySelectorAll("details");
    expect(details[0].open).toBe(false);
    await user.click(screen.getByText("שאלה ראשונה?"));
    expect(details[0].open).toBe(true);
  });
});
