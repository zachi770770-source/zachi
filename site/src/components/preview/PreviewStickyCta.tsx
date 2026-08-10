"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { previewClosing } from "@/content/sample";

/**
 * CTA דביק במובייל בלבד לעמוד ההצצה — מפנה לטופס ההרשמה בסוף העמוד (#join).
 * אינו מסתיר תוכן או פוטר: הוא נחשף רק אחרי גלילה מעבר לאזור הקורא, נעלם (מחליק
 * מטה) כשטופס-הסיום נכנס לתצוגה (כדי לא לכסות את הטופס/הפוטר), ומוסתר כל עוד
 * באנר העוגיות פתוח. אין רכישה/מחיר, אין טיימר, אין מספרים מומצאים.
 */
export function PreviewStickyCta() {
  const [show, setShow] = React.useState(false);
  const [atForm, setAtForm] = React.useState(false);
  const [bannerOpen, setBannerOpen] = React.useState(false);

  // נחשף אחרי גלילה מעבר לאזור הקורא (setState רק ב-callback של scroll).
  React.useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // נעלם כשטופס-הסיום (#join) בתצוגה — לא מכסה את הטופס/הפוטר.
  React.useEffect(() => {
    const form = document.getElementById("join");
    if (!form || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setAtForm(e.isIntersecting), {
      threshold: 0.01,
    });
    io.observe(form);
    return () => io.disconnect();
  }, []);

  // מוסתר כל עוד באנר העוגיות פתוח (אות מפורש מ-CookieConsent).
  React.useEffect(() => {
    const readAttr = () => document.body.getAttribute("data-cookie-banner") === "open";
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setBannerOpen(typeof detail?.open === "boolean" ? detail.open : readAttr());
    };
    const raf = requestAnimationFrame(() => setBannerOpen(readAttr()));
    window.addEventListener("cookie-banner-change", onChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("cookie-banner-change", onChange);
    };
  }, []);

  const visible = show && !atForm && !bannerOpen;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 md:hidden ${
        visible ? "" : "pointer-events-none"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="mx-3 mb-3 flex items-center justify-between gap-3 rounded-full border border-border bg-surface/95 px-4 py-2.5 shadow-lg backdrop-blur transition-[transform,opacity] duration-300 motion-reduce:transition-none"
        style={{
          transform: visible ? "translateY(0)" : "translateY(180%)",
          opacity: visible ? 1 : 0,
        }}
      >
        <span className="ps-1 text-[13px] font-medium text-foreground-muted">
          הספר זמין
        </span>
        <Link
          href="#join"
          className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-foreground px-5 text-[14px] font-semibold text-surface transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          tabIndex={visible ? undefined : -1}
        >
          {previewClosing.stickyCta}
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
