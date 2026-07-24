"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * עוטף תוכן בהופעה עדינה (fade + translate) כשהוא נכנס למסך.
 * מכבד prefers-reduced-motion דרך ה-CSS ב-globals.css.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  delay?: number;
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", visible && "is-visible", className)}
    >
      {children}
    </Tag>
  );
}
