/**
 * `withViewTransition` — פרימיטיב משותף לשפת-התנועה של האתר.
 *
 * מריץ עדכון-DOM בתוך View Transition כשהתנועה מותרת (`html.motion-js` פעיל —
 * JS חי, IntersectionObserver נתמך, ואין prefers-reduced-motion; נקבע ב-
 * MotionRoot) והדפדפן תומך ב-API. אחרת — עדכון רגיל ומיידי. כך אותה זרימה
 * עובדת בכל סביבה, וללא-תמיכה / reduced-motion / ללא-JS מקבלים מעבר-מצב מיידי.
 *
 * ה-callback אמור להכיל את עדכון-ה-state; מי שקורא אחראי ל-flush סינכרוני של
 * ה-DOM (למשל `flushSync`) כדי שהמצב החדש ייצולם בתוך המעבר.
 */
export function withViewTransition(update: () => void): void {
  if (typeof document === "undefined") {
    update();
    return;
  }
  const doc = document as Document & {
    startViewTransition?: (cb: () => void | Promise<void>) => unknown;
  };
  const motionAllowed = document.documentElement.classList.contains("motion-js");
  if (!motionAllowed || typeof doc.startViewTransition !== "function") {
    update();
    return;
  }
  doc.startViewTransition(update);
}
