import type { ReactNode } from "react";
import { Badge } from "@tutorpal/ui/badge";
import { Breadcrumb } from "@tutorpal/ui/breadcrumb";

type IntegrationConfigLayoutProps = {
  parentLabel: string;
  mobileParentLabel: string;
  parentTo: string;
  title: string;
  badgeLabel: string;
  description: string;
  providerMark: ReactNode;
  children: ReactNode;
  aside: ReactNode;
  footer?: ReactNode;
};

export function IntegrationConfigLayout({
  parentLabel,
  mobileParentLabel,
  parentTo,
  title,
  badgeLabel,
  description,
  providerMark,
  children,
  aside,
  footer,
}: IntegrationConfigLayoutProps) {
  return (
    <section className="@container mx-auto w-full max-w-[1040px] pb-10">
      <Breadcrumb
        className="mb-6"
        items={[
          { label: parentLabel, to: parentTo },
          { label: title },
        ]}
        backLabel={mobileParentLabel}
      />

      <header className="flex min-w-0 items-start gap-3">
        <div
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-xs font-semibold tracking-wide text-foreground"
        >
          {providerMark}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="text-2xl font-normal tracking-[-0.02em] text-foreground">{title}</h1>
            <Badge variant="neutral">{badgeLabel}</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </header>

      <div className="mt-6 grid min-w-0 gap-6 @[824px]:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="min-w-0">{children}</div>
        <aside className="min-w-0 @[824px]:w-[17.5rem] @[824px]:justify-self-end">{aside}</aside>
      </div>
      {footer}
    </section>
  );
}
