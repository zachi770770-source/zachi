import { cn } from "@/lib/utils";

/**
 * המוטיב החתום של הזהות: "מחיפוש לבנייה".
 * מימין (תחילת הקריאה ב-RTL) נקודות מפוזרות — החיפוש, ההשוואה, הרעש.
 * הן מתלכדות שמאלה אל טבעת בנויה משני חצאים — הבנייה של קשר.
 * דקורטיבי בלבד (aria-hidden).
 */
export function SearchToBuild({ className }: { className?: string }) {
  // נקודות שמתלכדות: מפוזרות בימין, מסתדרות על קו לכיוון שמאל.
  const dots = [
    { x: 452, y: 20, r: 3, o: 0.28 },
    { x: 430, y: 54, r: 2.4, o: 0.32 },
    { x: 410, y: 30, r: 3.4, o: 0.4 },
    { x: 388, y: 48, r: 2.2, o: 0.36 },
    { x: 368, y: 24, r: 2.8, o: 0.5 },
    { x: 344, y: 44, r: 2.4, o: 0.5 },
    { x: 322, y: 34, r: 2.6, o: 0.62 },
    { x: 298, y: 40, r: 2.4, o: 0.66 },
    { x: 274, y: 38, r: 2.4, o: 0.74 },
    { x: 250, y: 40, r: 2.4, o: 0.82 },
    { x: 226, y: 40, r: 2.4, o: 0.9 },
  ];

  return (
    <svg
      viewBox="0 0 480 80"
      fill="none"
      aria-hidden="true"
      className={cn("overflow-visible", className)}
    >
      {/* קו מנחה עדין שהנקודות מתיישרות אליו */}
      <path
        d="M 220 40 H 452"
        stroke="currentColor"
        strokeOpacity="0.14"
        strokeWidth="1"
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="currentColor" fillOpacity={d.o} />
      ))}

      {/* הטבעת הבנויה (משמאל) — שני חצאים שנפגשים */}
      <g transform="translate(90 40)">
        <path
          d="M 6 -32 A 32 32 0 0 0 6 32"
          stroke="currentColor"
          strokeOpacity="0.5"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M -6 -32 A 32 32 0 0 1 -6 32"
          stroke="var(--color-brand)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="6" cy="-32" r="3.2" fill="currentColor" fillOpacity="0.7" />
        <circle cx="-6" cy="32" r="3.2" fill="var(--color-brand)" />
      </g>
    </svg>
  );
}
