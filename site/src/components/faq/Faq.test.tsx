import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Faq } from "@/components/faq/Faq";

const items = [
  { id: "q1", question: "שאלה ראשונה?", answer: "תשובה ראשונה." },
  { id: "q2", question: "שאלה שנייה?", answer: "תשובה שנייה." },
];

describe("Faq", () => {
  it("renders every question, collapsed by default", () => {
    render(<Faq items={items} />);
    const trigger = screen.getByRole("button", { name: "שאלה ראשונה?" });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("שאלה שנייה?")).toBeInTheDocument();
  });

  it("reveals the answer when a question is opened", async () => {
    const user = userEvent.setup();
    render(<Faq items={items} />);

    const trigger = screen.getByRole("button", { name: "שאלה ראשונה?" });
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("תשובה ראשונה.")).toBeVisible();
  });
});
