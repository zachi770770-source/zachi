import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import { HomePathEntry } from "@/components/sections/HomePathEntry";
import { homePathUi } from "@/content/homePaths";

/**
 * האפורדנס של תיבת-הכניסה הראשית תלוי-מצב: כשהכתיבה-החופשית חיה זו באמת תיבת-
 * כתיבה (סמן מהבהב + אייקון עֵט + רמז „אפשר לכתוב…”); בברירת המחדל (המצפן המודרך
 * בלבד) לחיצה פותחת שיחה מודרכת, ולכן אין סמן-כתיבה שמבטיח הקלדה, האייקון הוא
 * מצפן, והרמז מתאר את המהלך המודרך. בשני המצבים הקישור הבסיסי הוא אותו `<a>` אל
 * /compass (SEO / ללא-JS), והכיתוב המזמין נשמר.
 */
describe("HomePathEntry — surface-aware primary composer", () => {
  it("guided (default): no blinking write-caret, compass icon, guided hint", () => {
    const { container, queryByText } = render(<HomePathEntry />);
    const composer = container.querySelector("a.home-composer");
    expect(composer).not.toBeNull();
    expect(composer!.getAttribute("href")).toBe("/compass");
    // אין סמן-כתיבה מהבהב — הוא מבטיח הקלדה שאינה מתקיימת במצב המודרך.
    expect(container.querySelector(".home-composer__caret")).toBeNull();
    // אייקון מצפן (זהות „שאל את הספר”), לא עֵט.
    expect(composer!.querySelector("svg.lucide-compass")).not.toBeNull();
    expect(composer!.querySelector("svg.lucide-pen-line")).toBeNull();
    // רמז מודרך, לא רמז-כתיבה.
    expect(queryByText(homePathUi.composerHintGuided)).not.toBeNull();
    expect(queryByText(homePathUi.composerHint)).toBeNull();
    // הכיתוב המזמין נשמר בשני המצבים.
    expect(queryByText(homePathUi.composerLead)).not.toBeNull();
  });

  it("free-text live: write-caret present, pen icon, write hint", () => {
    const { container, queryByText } = render(<HomePathEntry freeTextEnabled />);
    const composer = container.querySelector("a.home-composer");
    expect(composer).not.toBeNull();
    expect(composer!.getAttribute("href")).toBe("/compass");
    // סמן-הכתיבה חוזר — „אפשר להקליד כאן”.
    expect(container.querySelector(".home-composer__caret")).not.toBeNull();
    // אייקון עֵט (כתיבה), לא מצפן.
    expect(composer!.querySelector("svg.lucide-pen-line")).not.toBeNull();
    expect(composer!.querySelector("svg.lucide-compass")).toBeNull();
    // רמז-כתיבה, לא הרמז המודרך.
    expect(queryByText(homePathUi.composerHint)).not.toBeNull();
    expect(queryByText(homePathUi.composerHintGuided)).toBeNull();
    expect(queryByText(homePathUi.composerLead)).not.toBeNull();
  });
});
