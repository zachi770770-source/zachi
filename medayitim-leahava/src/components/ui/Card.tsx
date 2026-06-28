import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}

export function Card({ children, className = "", as = "div" }: CardProps) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 shadow-[0_2px_16px_rgba(126,100,81,0.06)] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-ink-900">{children}</h3>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="mt-2 text-ink-700">{children}</div>;
}
