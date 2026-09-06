"use client";

import * as React from "react";
import Link from "next/link";

import type { BookControls } from "./scene";

/**
 * ההצגה החתומה של ה-Hero: ספר עברי פיזי ב-WebGL (Three.js). נטען *עצלנית* ורק
 * כשמותר תנועה ו-WebGL זמין — אחרת הרכיב אינו מרנדר כלום, וה-fallback ב-CSS/
 * `<img>` (ב-`BookCover`) נשאר. הלולאה רצה רק לאורך הרצף ואז נעצרת (idle — בלי
 * לולאת-WebGL תמידית); render בודד בלבד ב-resize. ניקוי מלא ב-unmount.
 *
 * progressive enhancement: SSR/no-JS/reduced-motion/no-WebGL ⇒ שום canvas.
 */
export function HeroBookGL({
  coverSrc,
  coverAlt,
  onActive,
}: {
  coverSrc: string;
  coverAlt: string;
  onActive?: (active: boolean) => void;
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;

    // בדיקת WebGL זמינות (בלי ליצור את הסצנה הכבדה אם אין).
    try {
      const test = document.createElement("canvas");
      const gl = test.getContext("webgl2") || test.getContext("webgl");
      if (!gl) return;
    } catch {
      return;
    }

    let controls: BookControls | null = null;
    let raf = 0;
    let ro: ResizeObserver | null = null;
    let cancelled = false;
    let start = 0;

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const DURATION = mobile ? 4300 : 5200;

    const run = async () => {
      const img = new Image();
      img.decoding = "async";
      img.src = coverSrc;
      try {
        await img.decode();
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {
        /* ממשיכים גם אם ה-decode/fonts נכשלו — הטקסטורות עדיין ייצרבו */
      }
      if (cancelled) return;

      const { createBookScene } = await import("./scene");
      if (cancelled) return;

      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      controls = createBookScene(canvas, img, { dpr, mobile });

      const sizeToWrap = () => {
        const r = wrap.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) controls?.resize(r.width, r.height);
      };
      sizeToWrap();

      setActive(true);
      onActive?.(true);

      // וו-בדיקה (QA): מאפשר לכוון progress דטרמיניסטית ללכידת פרימים. לא
      // מפעיל שום התנהגות בפרודקשן — נקרא רק אם נקבע לפני הטעינה.
      const manual = (window as unknown as { __BOOK_MANUAL__?: boolean }).__BOOK_MANUAL__ === true;
      (window as unknown as { __book?: unknown }).__book = {
        setProgress: (p: number) => {
          controls?.setProgress(p);
          controls?.render();
        },
      };
      if (manual) {
        controls.setProgress(0);
        controls.render();
        return;
      }

      // רצף מונע-progress; נעצר בהתיישבות (idle).
      const tick = (now: number) => {
        if (cancelled || !controls) return;
        if (!start) start = now;
        const p = Math.min((now - start) / DURATION, 1);
        controls.setProgress(p);
        controls.render();
        if (p < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          raf = 0; // idle — אין יותר לולאה
        }
      };
      raf = requestAnimationFrame(tick);

      // resize: render בודד (בלי להחיות מחדש את הרצף).
      ro = new ResizeObserver(() => {
        const r = wrap.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          controls?.resize(r.width, r.height);
          if (!raf) controls?.render();
        }
      });
      ro.observe(wrap);
    };

    run();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      controls?.dispose();
      onActive?.(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverSrc]);

  return (
    <div ref={wrapRef} className="hero-bookgl" data-active={active ? "true" : undefined}>
      <Link
        href="/preview"
        aria-label={coverAlt}
        className="hero-bookgl__link"
        data-vt-book-source
      >
        <canvas ref={canvasRef} className="hero-bookgl__canvas" aria-hidden="true" />
      </Link>
    </div>
  );
}
