import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, within } from "@testing-library/react";

import { TrustStrip } from "@/components/sections/TrustStrip";

afterEach(cleanup);

describe("TrustStrip", () => {
  it("renders the three factual items as an accessible list", () => {
    const { getByRole } = render(<TrustStrip />);
    const list = getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("3 תחנות במסע הזוגי");
    expect(items[1]).toHaveTextContent("6 כלים מעשיים");
    expect(items[2]).toHaveTextContent("טעימה חופשית מהספר");
  });

  it("marks the visual separators as decorative (aria-hidden) — SR gets items, not dots", () => {
    const { container } = render(<TrustStrip />);
    const decorative = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorative.length).toBe(2); // שתי נקודות בין שלושת הפריטים
  });

  it("exposes a labelled region (editorial, not a promo banner)", () => {
    const { getByRole } = render(<TrustStrip />);
    expect(
      getByRole("region", { name: "עובדות על הספר" })
    ).toBeInTheDocument();
  });
});
