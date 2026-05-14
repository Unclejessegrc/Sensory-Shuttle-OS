import type { ReactNode } from "react";

/**
 * Consistent page header used across all /app pages so spacing, type ramp,
 * and right-side action area stay in sync.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between pb-2 border-b border-border/60">
      <div className="space-y-1">
        {eyebrow && (
          <div className="text-[10px] uppercase tracking-[0.14em] text-primary font-semibold">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
