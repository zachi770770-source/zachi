import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-sand-300 bg-sand-100/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-3xl">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink-800">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-clay-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
