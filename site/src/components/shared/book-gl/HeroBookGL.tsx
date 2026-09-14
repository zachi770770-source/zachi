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

    /**
     * „ספר-ה-GL עומד לרוץ” — מסומן *מיד*, לפני טעינת הסצנה.
     *
     * למה: כריכת-ה-CSS (fallback) והקנבס תפסו גבהים שונים והתחלפו ב-`display`
     * באמצע הטעינה. נמדד: קפיצת-פריסה של 0.096, ו-CLS כולל 0.127 בדסקטופ —
     * מעל סף ה„טוב”. הבדיקות למעלה (תנועה-מופחתת + זמינות WebGL) סינכרוניות,
     * ולכן אפשר לתפוס את התיבה כבר כאן.
     *
     * נכתב ישירות ל-DOM ולא דרך state: זהו סימון-תצוגה טהור שאינו משפיע על
     * שום החלטת-רינדור, ו-setState סינכרוני בתוך effect גורר רינדור מדורג
     * מיותר (וגם נחסם בכלל-הלינט של React).
     */
    wrap.dataset.reserve = "true";

    let controls: BookControls | null = null;
    let raf = 0;
    let ro: ResizeObserver | null = null;
    let cancelled = false;
    let start = 0;
    let cleanupAmbient: (() => void) | null = null;

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    // שכבת-החיים רצה בשני הגדלים. קודם היא הייתה דסקטופ-בלבד, ואז הספר
    // *נעצר* במובייל בסוף הרצף — מצב קפוא ממש. היא עדיין מגודרת ב-onScreen
    // ובנראות-הלשונית, ובמובייל היא רצה בקצב נמוך יותר.
    const ambientAllowed = true;

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
      // אורך הרצף מגיע מהסצנה — מקור-אמת אחד. קודם הוא היה קבוע כאן, במקום
      // שאינו יודע דבר על הכוריאוגרפיה עצמה.
      const DURATION = controls.duration;

      const sizeToWrap = () => {
        const r = wrap.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) controls?.resize(r.width, r.height);
      };

      // סדר קריטי: המכל מוסתר ב-`display:none` עד ש-`data-active` נקבע, ולכן
      // מדידה *לפני* ההפעלה מחזירה 0×0 והסצנה נשארת על aspect=1 — הספר נמתח
      // אופקית ביחס-הקנבס (1.4×) עד שה-ResizeObserver מדביק. נמדד בלכידת-
      // פריימים, ובפרודקשן זה פריים ראשון שגוי. לכן: מפעילים, מודדים, ורק
      // אז מרנדרים.
      setActive(true);
      onActive?.(true);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (cancelled) return;
      sizeToWrap();

      // resize: render בודד (בלי להחיות מחדש את הרצף). מותקן *לפני* מסלול
      // ה-QA, כדי ששינוי-גודל יתוקן גם שם.
      ro = new ResizeObserver(() => {
        const r = wrap.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          controls?.resize(r.width, r.height);
          if (!raf) controls?.render();
        }
      });
      ro.observe(wrap);

      // וו-בדיקה (QA): מאפשר לכוון progress דטרמיניסטית ללכידת פרימים. לא
      // מפעיל שום התנהגות בפרודקשן — נקרא רק אם נקבע לפני הטעינה.
      const manual = (window as unknown as { __BOOK_MANUAL__?: boolean }).__BOOK_MANUAL__ === true;
      (window as unknown as { __book?: unknown }).__book = {
        setProgress: (p: number) => {
          controls?.setProgress(p);
          controls?.render();
        },
        // וו-בדיקה לשכבת-החיים: מאפשר לצלם את מצב-המנוחה בזמן נתון במקום
        // להמתין לשעון-הקיר, וכך להפיק תיעוד בקצב-אמת ודטרמיניסטי.
        setAmbient: (sec: number, scrollP = 0) => {
          controls?.setAmbient(sec, scrollP);
          controls?.render();
        },
      };
      if (manual) {
        controls.setProgress(0);
        controls.render();
        return;
      }

      // ── מצב-הסצנה: רצף → חיים ────────────────────────────────────────
      // קודם הלולאה פשוט נעצרה בסוף הרצף, והספר הפך לתמונה קפואה. עכשיו היא
      // עוברת למצב שני, מרוסן בהרבה: סחיפה של 0.35° ופרלקסת-גלילה של 1.7°,
      // ב-30fps, ורק כשהספר באמת על המסך ובלשונית פעילה.
      let intro = true;
      let ambientT0 = 0;
      let lastAmbient = 0;
      let onScreen = true;
      let scrollP = 0;

      const heroProgress = () => {
        const hero = wrap.closest<HTMLElement>(".sig-hero") ?? wrap;
        const r = hero.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // 0 בראש ה-Hero, 1 כשתחתיתו מגיעה לראש החלון.
        return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh * 0.2)));
      };

      const tick = (now: number) => {
        if (cancelled || !controls) return;
        if (!start) start = now;

        if (intro) {
          const p = Math.min((now - start) / DURATION, 1);
          controls.setProgress(p);
          controls.render();
          if (p < 1) {
            raf = requestAnimationFrame(tick);
            return;
          }
          intro = false;
          ambientT0 = now;
          if (!ambientAllowed) {
            raf = 0; // מובייל: נעצר בהתיישבות, בדיוק כמו קודם
            return;
          }
        }

        // ‎30fps‎ בדסקטופ, ‎20fps‎ במובייל: בתנועה איטית כזו אין הבדל נראה,
        // והעלות יורדת.
        if (onScreen && now - lastAmbient >= (mobile ? 50 : 33)) {
          lastAmbient = now;
          controls.setAmbient((now - ambientT0) / 1000, scrollP);
          controls.render();
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      const onScroll = () => {
        scrollP = heroProgress();
      };
      const onVisibility = () => {
        onScreen = !document.hidden && vis;
      };
      let vis = true;
      const visIo = new IntersectionObserver(
        (entries) => {
          vis = entries.some((e) => e.isIntersecting);
          onScreen = !document.hidden && vis;
          // חזרה למסך אחרי הפסקה: מרנדרים פריים אחד כדי שלא יישאר פריים ישן.
          if (onScreen && !intro) controls?.render();
        },
        { threshold: 0.01 }
      );
      visIo.observe(wrap);
      if (ambientAllowed) {
        window.addEventListener("scroll", onScroll, { passive: true });
        document.addEventListener("visibilitychange", onVisibility);
      }
      cleanupAmbient = () => {
        visIo.disconnect();
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", onVisibility);
      };

    };

    run();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      cleanupAmbient?.();
      controls?.dispose();
      onActive?.(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverSrc]);

  return (
    <div
      ref={wrapRef}
      className="hero-bookgl"
      data-active={active ? "true" : undefined}
    >
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
