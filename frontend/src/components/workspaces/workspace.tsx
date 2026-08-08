import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WorkspaceShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto w-full max-w-7xl", className)}>
      {children}
    </section>
  );
}

export function WorkspaceHeader({
  title,
  countLabel,
  action,
}: {
  title: string;
  countLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 py-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-balance text-2xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          {countLabel ? (
            <span className="text-sm font-medium text-muted-foreground">
              {countLabel}
            </span>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function WorkspaceMain({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function WorkspaceToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
      {children}
    </div>
  );
}

export function WorkspaceList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}
