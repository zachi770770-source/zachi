import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { ArticleSchema } from "@/components/schema/ArticleSchema";
import { entityId } from "@/components/schema/ids";

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
