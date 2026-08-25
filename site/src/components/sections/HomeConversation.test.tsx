import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, screen, waitFor, fireEvent } from "@testing-library/react";

import { HomeConversation } from "@/components/sections/HomeConversation";
import { homeConversationUi as ui } from "@/content/homeConversation";
import { JOURNEYS } from "@/content/journeys";

/**
 * החוזה השיחתי בצד הלקוח: שלב-פתיחה → תשובה מעוגנת → שאלת-המשך → תור המשך;
 * נפילה בחן למסלול המודרך כשלא זמין; ואפס אחסון מתמשך של מה שנכתב. הרשת מדומה.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

type Handler = (url: string, init?: RequestInit) => unknown;

function mockFetch(handler: Handler) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fn = vi.fn((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve({ ok: true, json: () => Promise.resolve(handler(url, init)) });
  });
  // @ts-expect-error מדמים fetch גלובלי
  global.fetch = fn;
  return calls;
}

const bodyOf = (init?: RequestInit) => JSON.parse(String(init?.body ?? "{}"));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
});

describe("HomeConversation", () => {
  it("שלב הפתיחה מציג הזמנה חופשית כשהעוזר זמין", async () => {
    mockFetch((_u, init) =>
      !init || init.method === "GET" ? { available: true, remaining: 8 } : {},
    );
    render(<HomeConversation station="dating" />);
    expect(await screen.findByLabelText(ui.invitePrompt)).toBeInTheDocument();
  });

  it("תור ראשון: שולח mode=conversation, מציג תשובה ושאלת-המשך", async () => {
    const calls = mockFetch((_u, init) => {
      if (!init || init.method === "GET") return { available: true, remaining: 8 };
      return {
        available: true,
        status: "answered",
        answer: "ארבע שעות לבד לא אומרות את זה.",
        citation: "מבוסס על פרק 4",
        followup: "יש עוד משהו שגרם לכם להרגיש שהיא התרחקה?",
        done: false,
      };
    });

    render(<HomeConversation station="dating" />);
    const box = await screen.findByLabelText(ui.invitePrompt);
    fireEvent.change(box, { target: { value: "היא לא ענתה לי ארבע שעות, ברור שנגמר" } });
    fireEvent.click(screen.getByRole("button", { name: ui.send }));

    expect(await screen.findByText("ארבע שעות לבד לא אומרות את זה.")).toBeInTheDocument();
    expect(screen.getByText("יש עוד משהו שגרם לכם להרגיש שהיא התרחקה?")).toBeInTheDocument();

    const postBody = bodyOf(calls.find((c) => c.init?.method === "POST")?.init);
    expect(postBody.mode).toBe("conversation");
    expect(postBody.station).toBe("dating");
    expect(postBody.context).toEqual([]);
  });

  it("תור המשך: שולח את ההקשר הקודם (שאלה + תשובה)", async () => {
    let turn = 0;
    const calls = mockFetch((_u, init) => {
      if (!init || init.method === "GET") return { available: true, remaining: 8 };
      turn += 1;
      return {
        available: true,
        status: "answered",
        answer: turn === 1 ? "תשובה ראשונה." : "תשובה שנייה.",
        citation: "מבוסס על פרק 4",
        followup: turn === 1 ? "מה עוד קרה שם?" : undefined,
        done: turn !== 1,
      };
    });

    render(<HomeConversation station="dating" />);
    const box = await screen.findByLabelText(ui.invitePrompt);
    fireEvent.change(box, { target: { value: "היא לא ענתה ארבע שעות" } });
    fireEvent.click(screen.getByRole("button", { name: ui.send }));

    // עונים לשאלת-ההמשך.
    const followupBox = await screen.findByLabelText(ui.followupEyebrow);
    fireEvent.change(followupBox, { target: { value: "כן, גם ביטלה פעמיים" } });
    fireEvent.click(screen.getByRole("button", { name: ui.followupSend }));

    await screen.findByText("תשובה שנייה.");

    const posts = calls.filter((c) => c.init?.method === "POST");
    expect(posts).toHaveLength(2);
    const secondCtx = bodyOf(posts[1].init).context;
    expect(secondCtx).toEqual([
      { role: "user", text: "היא לא ענתה ארבע שעות" },
      { role: "assistant", text: "תשובה ראשונה." },
    ]);
  });

  it("סגירה מועילה (valueDelivered, בלי סיווג): גשר גנרי + רכישה ראשית", async () => {
    mockFetch((_u, init) =>
      !init || init.method === "GET"
        ? { available: true, remaining: 8 }
        : {
            available: true,
            status: "answered",
            answer: "דפוס שחוזר אומר יותר מרגע בודד.",
            citation: "פרק 4",
            valueDelivered: true,
            done: true,
          },
    );
    render(<HomeConversation station="dating" />);
    const box = await screen.findByLabelText(ui.invitePrompt);
    fireEvent.change(box, { target: { value: "היא לא ענתה לי ארבע שעות" } });
    fireEvent.click(screen.getByRole("button", { name: ui.send }));

    expect(await screen.findByText(ui.closingBridge)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: ui.closingCtaAria });
    expect(cta).toHaveAttribute("href", expect.stringContaining("amazon."));
    expect(screen.getByText(ui.closingCtaSub)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ui.restart })).toBeInTheDocument();
  });

  it("סגירה מותאמת-מסע: גשר-מסע + קישור-כלי משני, ואמזון נשאר ראשי", async () => {
    mockFetch((_u, init) =>
      !init || init.method === "GET"
        ? { available: true, remaining: 8 }
        : {
            available: true,
            status: "answered",
            answer: "שווה להפריד בין מה שקרה למה שהמוח סיפר.",
            citation: "פרק 4",
            valueDelivered: true,
            currentSituation: "interpreting-signals",
            toolSurfaced: {
              slug: "fact-story",
              path: "/method/fact-story",
              term: "עובדה, סיפור, פעולה",
            },
            done: true,
          },
    );
    render(<HomeConversation station="dating" />);
    const box = await screen.findByLabelText(ui.invitePrompt);
    fireEvent.change(box, { target: { value: "היא לא ענתה, זה אומר שלא מעוניינת?" } });
    fireEvent.click(screen.getByRole("button", { name: ui.send }));

    // גשר מותאם-מסע (לא הגנרי), קישור-כלי משני אל /method/fact-story, ואמזון ראשי.
    expect(await screen.findByText(JOURNEYS["interpreting-signals"].bridge)).toBeInTheDocument();
    expect(screen.queryByText(ui.closingBridge)).toBeNull();
    const toolLink = screen.getByRole("link", {
      name: JOURNEYS["interpreting-signals"].toolLinkLabel,
    });
    expect(toolLink).toHaveAttribute("href", "/method/fact-story");
    const cta = screen.getByRole("link", { name: ui.closingCtaAria });
    expect(cta).toHaveAttribute("href", expect.stringContaining("amazon."));
  });

  it("answered בלי valueDelivered → סגירה שקטה, בלי גשר וללא CTA (אמפתיה לא מוכרת)", async () => {
    mockFetch((_u, init) =>
      !init || init.method === "GET"
        ? { available: true, remaining: 8 }
        : {
            available: true,
            status: "answered",
            answer: "אני שומע אותך.",
            citation: "פרק 4",
            valueDelivered: false,
            done: true,
          },
    );
    render(<HomeConversation station="dating" />);
    const box = await screen.findByLabelText(ui.invitePrompt);
    fireEvent.change(box, { target: { value: "רק רציתי לשתף" } });
    fireEvent.click(screen.getByRole("button", { name: ui.send }));

    expect(await screen.findByText(ui.closingQuiet)).toBeInTheDocument();
    expect(screen.queryByText(ui.closingBridge)).toBeNull();
    expect(screen.queryByRole("link", { name: ui.closingCtaAria })).toBeNull();
  });

  it("מענה-בטיחות נסגר בשקט — בלי גשר-ספר ובלי קישור-רכישה", async () => {
    mockFetch((_u, init) =>
      !init || init.method === "GET"
        ? { available: true, remaining: 8 }
        : {
            available: true,
            status: "safety",
            answer: "אם קשה עכשיו, שווה לדבר עם מישהו שסומכים עליו.",
          },
    );
    render(<HomeConversation station="dating" />);
    const box = await screen.findByLabelText(ui.invitePrompt);
    fireEvent.change(box, { target: { value: "קשה לי מאוד" } });
    fireEvent.click(screen.getByRole("button", { name: ui.send }));

    expect(await screen.findByText(ui.closingQuiet)).toBeInTheDocument();
    expect(screen.queryByText(ui.closingBridge)).toBeNull();
    expect(screen.queryByRole("link", { name: ui.closingCtaAria })).toBeNull();
  });

  it("אינו כותב את השיחה לאחסון מתמשך (פרטיות)", async () => {
    mockFetch((_u, init) =>
      !init || init.method === "GET"
        ? { available: true, remaining: 8 }
        : { available: true, status: "answered", answer: "כיוון קצר.", citation: "פרק 4", done: true },
    );
    render(<HomeConversation station="dating" />);
    const box = await screen.findByLabelText(ui.invitePrompt);
    fireEvent.change(box, { target: { value: "מה קורה כאן" } });
    fireEvent.click(screen.getByRole("button", { name: ui.send }));
    await screen.findByText("כיוון קצר.");
    expect((localStorage.setItem as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it("לא זמין → אין תיבת כתיבה חופשית, ויוצאים ממצב הטעינה אל המסלול המודרך", async () => {
    mockFetch(() => ({ available: false }));
    render(<HomeConversation />);
    // אחרי שהזמינות חוזרת „לא זמין”: אין הזמנה חופשית ואין כפתור שליחה שיחתי,
    // וגם אין עוד שלד-טעינה (aria-busy) — כלומר נפלנו לענף המודרך (AskRoute),
    // לא נשארנו בתיבה מתה. הרינדור החי של AskRoute נבדק ב-E2E (טעינה עצלה).
    await waitFor(() => {
      expect(screen.queryByLabelText(ui.invitePrompt)).toBeNull();
      expect(screen.queryByRole("button", { name: ui.send })).toBeNull();
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    });
  });
});
