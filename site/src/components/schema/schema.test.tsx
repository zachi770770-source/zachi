import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { ArticleSchema } from "@/components/schema/ArticleSchema";
import { entityId } from "@/components/schema/ids";
import { GuidePage } from "@/components/guides/GuidePage";
import { guideOrder, guides } from "@/content/guides";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, prefetch: () => {} }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(cleanup);

function jsonLd(container: HTMLElement) {
  return [...container.querySelectorAll('script[type="application/ld+json"]')].map(
    (s) => JSON.parse(s.textContent ?? "{}"),
  );
}

describe("ArticleSchema", () => {
  const { container } = render(
    <ArticleSchema headline="h" description="d" path="/guide/x" datePublished="2026-08-11" />,
  );
  const [article] = jsonLd(container);

  it("אינו ממציא publisher — אין ארגון אמיתי מאחורי האתר", () => {
    expect(article).not.toHaveProperty("publisher");
    expect(JSON.stringify(article)).not.toContain("Organization");
  });

  it("המחבר הוא ישות ה-Person הקנונית", () => {
    expect(article.author["@id"]).toBe(entityId.person);
  });
});

describe("BreadcrumbList במדריכים", () => {
  it.each(guideOrder)("%s — הסכימה זהה לפירורי-הלחם הגלויים", (slug) => {
    const { container } = render(<GuidePage guide={guides[slug]} />);
    const crumbs = jsonLd(container).find((d) => d["@type"] === "BreadcrumbList");
    const visible = [...container.querySelectorAll('nav[aria-label="פירורי לחם"] li')]
      .filter((li) => li.getAttribute("aria-hidden") !== "true")
      .map((li) => li.textContent?.trim());
    expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual(visible);
  });
});
