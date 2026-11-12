import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  getAppLanguage,
  setAppLanguage,
  type AppLanguage,
} from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  form: ReactNode;
  footer?: ReactNode;
  ctaArea?: ReactNode;
  headerAction?: ReactNode;
  beforeTitle?: ReactNode;
  className?: string;
  footerText?: string;
}

function LanguageSelector() {
  const { t } = useTranslation("auth");
  const activeLanguage = getAppLanguage();

  return (
    <div
      className="flex items-center gap-1"
      aria-label={t("footer.languageLabel")}
    >
      {(["en", "th"] as const).map((language) => (
        <button
          type="button"
          key={language}
          aria-pressed={activeLanguage === language}
          className={cn(
            "min-h-11 min-w-11 px-2 py-1 text-sm transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            activeLanguage === language
              ? "font-semibold text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => void setAppLanguage(language as AppLanguage)}
        >
          {t(`footer.language.${language}`)}
        </button>
      ))}
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  form,
  footer,
  ctaArea,
  headerAction,
  beforeTitle,
  className,
  footerText,
}: AuthShellProps) {
  const { t } = useTranslation(["auth", "common"]);

  return (
    <div className="flex min-h-dvh flex-col bg-card px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10 sm:pt-8">
      <header className="flex min-h-11 items-center justify-between gap-4">
        <Link
          to="/login"
          aria-label={t("common:appName")}
          className="flex min-h-11 items-center gap-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <img src="/app-icon.png" alt="" className="size-11 shrink-0" />
          <span className="hidden text-lg font-medium tracking-[-0.02em] sm:inline">
            TutorPal
          </span>
        </Link>
        {headerAction ? (
          <div className="shrink-0 text-sm text-muted-foreground">
            {headerAction}
          </div>
        ) : null}
      </header>

      <main className="flex flex-1 flex-col items-center sm:justify-center">
        <div
          className={cn(
            "flex w-full max-w-sm flex-1 flex-col pt-8 sm:flex-none sm:pt-0 sm:text-center",
            className,
          )}
        >
          <div className="space-y-3">
            {beforeTitle}
            <h1 className="text-balance text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-[2.5rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
          {form ? <div className="mt-8">{form}</div> : null}
          {ctaArea || footer ? (
            <div className="mt-auto pt-8 sm:mt-5 sm:pt-0">
              {ctaArea ? <div className="space-y-4">{ctaArea}</div> : null}
              {footer ? (
                <div className="pt-6 text-sm text-muted-foreground">
                  {footer}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>

      <footer className="flex items-center justify-end border-t border-border pt-3 text-xs leading-5 text-muted-foreground sm:flex-wrap sm:justify-between sm:gap-x-4 sm:gap-y-2 sm:pt-5">
        <p className="hidden sm:block">
          {footerText ?? t("auth:footer.legal")}
        </p>
        <LanguageSelector />
      </footer>
    </div>
  );
}
