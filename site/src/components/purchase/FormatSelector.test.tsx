import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent, within } from "@testing-library/react";

import { FormatSelector } from "@/components/purchase/FormatSelector";
import type { ProductFormat } from "@/lib/pricing";

afterEach(cleanup);

function renderSelector(value: ProductFormat = "digital") {
  const onChange = vi.fn();
  render(<FormatSelector value={value} onChange={onChange} />);
  return { onChange };
}

describe("FormatSelector, selected-state transitions", () => {
  it("marks the selected edition with aria-checked and a fully-shown check mark", () => {
    renderSelector("digital");
    const digital = screen.getByRole("radio", { name: /ספר דיגיטלי/ });
    expect(digital).toHaveAttribute("aria-checked", "true");

    // סימן הבחירה תמיד מרונדר ונכנס בעמעום/קנה-מידה — כשנבחר הוא גלוי במלואו.
    const check = digital.querySelector("svg.transition-\\[opacity\\2c transform\\]");
    // fallback: any svg carrying the crossfade classes
    const anyCheck =
      check ?? digital.querySelector("svg");
    expect(anyCheck).not.toBeNull();
    expect(anyCheck?.getAttribute("class") ?? "").toContain("opacity-100");
    expect(anyCheck?.getAttribute("class") ?? "").toContain("scale-100");
  });

  it("keeps the check mark hidden (not removed) on unselected, selectable editions, no layout shift", () => {
    // ניתן לבחור רק את הדיגיטלי בטרום-השקה; כשהערך אינו „digital”
    // (מצב היפותטי לבדיקת המעבר), הסימן קיים אך שקוף.
    renderSelector("physical");
    const digital = screen.getByRole("radio", { name: /ספר דיגיטלי/ });
    const svg = digital.querySelector("svg");
    expect(svg).not.toBeNull(); // הסימן קיים בדום (מעבר, לא render מותנה)
    expect(svg?.getAttribute("class") ?? "").toContain("opacity-0");
  });

  it("has a smooth transition on the option shell (field-anim) rather than an instant swap", () => {
    renderSelector("digital");
    const digital = screen.getByRole("radio", { name: /ספר דיגיטלי/ });
    expect(digital.className).toContain("field-anim");
  });

  it("does not select unavailable editions and shows a 'coming soon' badge", () => {
    const { onChange } = renderSelector("digital");
    const physical = screen.getByRole("radio", { name: /ספר מודפס/ });
    expect(physical).toBeDisabled();
    expect(within(physical).getByText("בקרוב")).toBeInTheDocument();
    fireEvent.click(physical);
    expect(onChange).not.toHaveBeenCalled();
  });
});
