import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { QuantitySelector } from "@/components/purchase/QuantitySelector";

describe("QuantitySelector", () => {
  it("renders an option for each enabled quantity offer", () => {
    render(<QuantitySelector value={1} onChange={() => {}} />);
    expect(screen.getByText("עותק אחד")).toBeInTheDocument();
    expect(screen.getByText("שני עותקים")).toBeInTheDocument();
    expect(screen.getByText("שלושה עותקים")).toBeInTheDocument();
  });

  it("marks the currently selected quantity as checked", () => {
    render(<QuantitySelector value={2} onChange={() => {}} />);
    const options = screen.getAllByRole("radio");
    const selected = options.find((el) => el.getAttribute("aria-checked") === "true");
    expect(selected).toHaveTextContent("שני עותקים");
  });

  it("calls onChange with the chosen quantity", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantitySelector value={1} onChange={onChange} />);

    await user.click(screen.getByText("שני עותקים"));

    expect(onChange).toHaveBeenCalledWith(2);
  });
});
