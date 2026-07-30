import * as React from "react";

import { parseAnswerMarkdown, type Inline } from "@/lib/compass/answerFormat";

/**
 * מרנדר תשובת „המצפן” כ-Markdown מוגבל ובטוח: פסקאות, הדגשה ורשימות בלבד.
 * הטקסט מרונדר כאלמנטים של React (escaping אוטומטי) — אין HTML גולמי, אין
 * תמונות/קוד/קישורים, ואין dangerouslySetInnerHTML, ולכן אין הזרקת HTML.
 * ה-RTL נשמר ע"י ההקשר של האתר (dir=rtl) והזרימה הטבעית של הטקסט.
 */
function renderInline(spans: Inline[]): React.ReactNode[] {
  return spans.map((span, i) => {
    if (span.type === "strong") return <strong key={i}>{span.value}</strong>;
    if (span.type === "em") return <em key={i}>{span.value}</em>;
    return <React.Fragment key={i}>{span.value}</React.Fragment>;
  });
}

export function CompassAnswer({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseAnswerMarkdown(text);
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.type === "list") {
          const items = block.items.map((spans, j) => (
            <li key={j} className="ps-1">
              {renderInline(spans)}
            </li>
          ));
          return block.ordered ? (
            <ol key={i} className="mt-3 list-decimal space-y-1.5 pe-5 first:mt-0">
              {items}
            </ol>
          ) : (
            <ul key={i} className="mt-3 list-disc space-y-1.5 pe-5 first:mt-0">
              {items}
            </ul>
          );
        }
        return (
          <p key={i} className="mt-3 first:mt-0">
            {renderInline(block.spans)}
          </p>
        );
      })}
    </div>
  );
}
