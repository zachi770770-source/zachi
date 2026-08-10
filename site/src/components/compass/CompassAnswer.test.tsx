import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { CompassAnswer } from "@/components/compass/CompassAnswer";

afterEach(cleanup);

describe("CompassAnswer display", () => {
  it("renders **bold** as a <strong> element, not literal asterisks", () => {
    const { container } = render(<CompassAnswer text="צריך **חיפוש** מפוכח." />);
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe("חיפוש");
    // אין כוכביות גולמיות בטקסט המוצג.
    expect(container.textContent).toBe("צריך חיפוש מפוכח.");
    expect(container.textContent).not.toContain("**");
  });

  it("renders *italic* as an <em> element", () => {
    const { container } = render(<CompassAnswer text="*בעדינות*" />);
    expect(container.querySelector("em")?.textContent).toBe("בעדינות");
  });

  it("renders markdown lists as <ul>/<ol>", () => {
    const { container } = render(<CompassAnswer text={"- ראשון\n- שני"} />);
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
  });

  it("blocks raw HTML — no <script>, <img> or <b> elements are created", () => {
    const { container } = render(
      <CompassAnswer text={'<script>alert(1)</script> <img src=x onerror=y> <b>bold</b>'} />
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    // התוכן מוצג כטקסט מילולי (escaped), לא כ-HTML פעיל.
    expect(container.textContent).toContain("<script>alert(1)</script>");
    expect(container.textContent).toContain("<b>bold</b>");
  });

  it("does not create anchor/link elements from markdown link syntax", () => {
    const { container } = render(
      <CompassAnswer text="ראו [כאן](https://example.com)" />
    );
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("[כאן](https://example.com)");
  });
});
