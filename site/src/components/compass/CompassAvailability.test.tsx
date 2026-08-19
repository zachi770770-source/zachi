import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen, act, fireEvent, waitFor } from "@testing-library/react";

import { CompassConsole } from "@/components/compass/CompassConsole";
import { compass } from "@/content/compass";

/**
 * רגרסיה: „תיבת השאלה החופשית נעלמת באמצע ההקלדה”.
 *
 * הבאג: הטופס רונדר כבר בזמן שתשובת הזמינות (GET /api/compass) עוד בדרך. כשהיא
 * הגיעה עם „לא זמין” (עוזר סגור, תקלת רשת, גוף לא-JSON), הרכיב החליף את כל
 * הטופס במסך „בקרוב” — תיבת הכתיבה נעלמה מתחת לידיים של המשתמש, הטקסט שנכתב
 * אבד והפוקוס נפל ל-body. אותו דבר קרה גם בתשובת ה-POST.
 *
 * ההתנהגות הנדרשת: אין טופס אינטראקטיבי לפני שהזמינות ידועה; ואם העוזר נסגר
 * *אחרי* שהמשתמש כבר כתב, מודיעים בתוך הממשק בלי לפרק אותו ובלי לאבד את השאלה.
 */

const INPUT_LABEL = "כתבו כאן במילים שלכם";
const QUESTION = "למה היא מתרחקת ממני אחרי כמה דייטים טובים";

type FakeResponse = { ok: boolean; json: () => Promise<unknown> };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const json = (body: unknown): FakeResponse => ({ ok: true, json: () => Promise.resolve(body) });
/** תגובה שאינה JSON תקין — `res.json()` נכשל, בדיוק כמו דף שגיאה של השרת. */
const notJson = (): FakeResponse => ({
  ok: false,
  json: () => Promise.reject(new SyntaxError("Unexpected token < in JSON")),
});

/** מחליף את fetch: ה-GET (זמינות) וה-POST (שאלה) נשלטים בנפרד ובאופן דחוי. */
function installFetch(handlers: {
  get: () => Promise<FakeResponse>;
  post?: () => Promise<FakeResponse>;
}) {
  const fn = vi.fn((_url: string, init?: RequestInit) =>
    !init || init.method === "GET"
      ? handlers.get()
      : (handlers.post?.() ?? Promise.resolve(json({ available: true, status: "answered", answer: "…" }))),
  );
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CompassConsole, availability gating", () => {
  it("exposes no interactive textarea before availability resolves", async () => {
    const gate = deferred<FakeResponse>();
    installFetch({ get: () => gate.promise });

    render(<CompassConsole salesOpen={false} maxQuestionChars={400} />);

    // אין תיבת כתיבה, אין טופס ואין כפתור שליחה — רק מצב טעינה מוצהר.
    expect(screen.queryByLabelText(INPUT_LABEL)).toBeNull();
    expect(screen.queryByRole("button", { name: /שאל את הספר/ })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(compass.ui.loading);
  });

  it("never exposes the textarea when a delayed availability GET answers available:false", async () => {
    const gate = deferred<FakeResponse>();
    installFetch({ get: () => gate.promise });

    render(<CompassConsole salesOpen={false} maxQuestionChars={400} />);
    expect(screen.queryByLabelText(INPUT_LABEL)).toBeNull();

    await act(async () => {
      gate.resolve(json({ available: false }));
    });

    // מסך „בקרוב” — ומעולם לא הייתה תיבה שאפשר היה לכתוב לתוכה ולאבד.
    expect(await screen.findByText(compass.soon.title)).toBeInTheDocument();
    expect(screen.queryByLabelText(INPUT_LABEL)).toBeNull();
  });

  it("never exposes the textarea when the availability GET fails (network error)", async () => {
    const gate = deferred<FakeResponse>();
    installFetch({ get: () => gate.promise });

    render(<CompassConsole salesOpen={false} maxQuestionChars={400} />);
    expect(screen.queryByLabelText(INPUT_LABEL)).toBeNull();

    await act(async () => {
      gate.reject(new TypeError("Failed to fetch"));
    });

    expect(await screen.findByText(compass.soon.title)).toBeInTheDocument();
    expect(screen.queryByLabelText(INPUT_LABEL)).toBeNull();
  });

  it("never exposes the textarea when the availability GET returns a non-JSON body", async () => {
    const gate = deferred<FakeResponse>();
    installFetch({ get: () => gate.promise });

    render(<CompassConsole salesOpen={false} maxQuestionChars={400} />);
    expect(screen.queryByLabelText(INPUT_LABEL)).toBeNull();

    await act(async () => {
      gate.resolve(notJson());
    });

    expect(await screen.findByText(compass.soon.title)).toBeInTheDocument();
    expect(screen.queryByLabelText(INPUT_LABEL)).toBeNull();
  });

  it("exposes the form only once availability resolves to available:true", async () => {
    const gate = deferred<FakeResponse>();
    installFetch({ get: () => gate.promise });

    render(<CompassConsole salesOpen={false} maxQuestionChars={400} />);
    expect(screen.queryByLabelText(INPUT_LABEL)).toBeNull();

    await act(async () => {
      gate.resolve(json({ available: true, remaining: 3 }));
    });

    const box = await screen.findByLabelText(INPUT_LABEL);
    expect(box).toBeInTheDocument();
    expect(box).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /שאל את הספר/ })).toBeInTheDocument();
  });

  it("keeps the form and the typed question when the POST answers available:false", async () => {
    const postGate = deferred<FakeResponse>();
    installFetch({
      get: () => Promise.resolve(json({ available: true, remaining: 3 })),
      post: () => postGate.promise,
    });

    render(<CompassConsole salesOpen={false} maxQuestionChars={400} />);
    const box = await screen.findByLabelText(INPUT_LABEL);
    fireEvent.change(box, { target: { value: QUESTION } });
    fireEvent.click(screen.getByRole("button", { name: /שאל את הספר/ }));

    await act(async () => {
      postGate.resolve(json({ available: false, status: "unavailable" }));
    });

    // הודעה בתוך הממשק — ולא החלפה של הטופס במסך „בקרוב”.
    await waitFor(() =>
      expect(screen.getByText(compass.soon.text)).toBeInTheDocument(),
    );
    const stillThere = screen.getByLabelText(INPUT_LABEL);
    expect(stillThere).toBeInTheDocument();
    expect(stillThere).toHaveValue(QUESTION); // השאלה שנכתבה נשמרה
  });
});
