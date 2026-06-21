import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  form: ReactNode;
  footer?: ReactNode;
  ctaArea?: ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  form,
  footer,
  ctaArea,
}: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-accent px-4 py-4 sm:px-6 sm:py-6 flex justify-center">
      <div
        className={cn(
          "flex w-full flex-col px-5 py-6 sm:max-w-xl sm:px-0 sm:py-0 justify-center",
        )}
      >
        <div className="space-y-8 sm:space-y-10">
          <div className="space-y-5">
            <div className="inline-flex h-14 min-w-14 items-center justify-center rounded-2xl border border-border bg-accent px-4 text-lg font-extrabold text-primary">
              TP
            </div>
            <div className="space-y-2">
              {eyebrow ? (
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="max-w-[12ch] text-4xl font-extrabold tracking-[-0.02em] text-foreground text-balance sm:text-5xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="max-w-[34ch] text-sm leading-6 text-muted-foreground sm:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">{form}</div>
        </div>

        <div className="mt-auto pt-8 sm:mt-0 sm:pt-10">
          {ctaArea ? <div className="space-y-4">{ctaArea}</div> : null}
          {footer ? (
            <div className="pt-6 text-sm text-muted-foreground">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
