import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");

  return (
    <div className="relative isolate flex min-h-dvh justify-center overflow-hidden bg-[#eaf1f8] px-4 py-4 sm:px-6 sm:py-6">
      <img
        aria-hidden="true"
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 size-full object-cover opacity-70"
        src="/stripe-auth-mesh.svg"
      />
      <div
        className={cn(
          "flex w-full flex-col justify-center rounded-xl border border-white/80 bg-white px-5 py-6 shadow-[0_16px_40px_rgba(31,71,112,0.12)] sm:max-w-xl sm:px-10 sm:py-10",
        )}
      >
        <div className="space-y-8 sm:space-y-10">
          <div className="space-y-2">
            <img
              src="/app-icon.png"
              alt={t("appName")}
              className="jun-sidebarIcon size-10"
            />
            {eyebrow ? (
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="max-w-[12ch] text-4xl font-light tracking-[-0.02em] text-foreground text-balance sm:text-5xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="max-w-[34ch] text-sm leading-6 text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            ) : null}
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
