import { FileQuestion, TriangleAlert, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { createPortal } from "react-dom";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fallbackTitleId = "route-fallback-title";

interface RouteFallbackLayoutProps {
  alert?: boolean;
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}

function RouteFallbackLayout({
  alert = false,
  children,
  description,
  icon: Icon,
  title,
}: RouteFallbackLayoutProps) {
  const fallbackRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    const appRoot = document.getElementById("root");
    const previousAriaHidden = appRoot?.getAttribute("aria-hidden");
    const previousInert = appRoot?.getAttribute("inert");
    const getFocusableElements = () =>
      Array.from(
        fallbackRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.tabIndex >= 0);
    const focusFirstElement = () => {
      (getFocusableElements()[0] ?? headingRef.current)?.focus();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const fallback = fallbackRef.current;
      const focusableElements = getFocusableElements();

      if (!fallback || focusableElements.length === 0) {
        event.preventDefault();
        headingRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        focusFirstElement();
        return;
      }

      const activeElement = document.activeElement;

      if (
        event.shiftKey &&
        (activeElement === firstElement ||
          activeElement === headingRef.current ||
          !fallback.contains(activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (lastElement === activeElement || !fallback.contains(activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!fallbackRef.current?.contains(event.target as Node)) {
        focusFirstElement();
      }
    };

    appRoot?.setAttribute("aria-hidden", "true");
    appRoot?.setAttribute("inert", "");
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);

      if (!appRoot) return;

      if (previousAriaHidden == null) {
        appRoot.removeAttribute("aria-hidden");
      } else {
        appRoot.setAttribute("aria-hidden", previousAriaHidden);
      }

      if (previousInert == null) {
        appRoot.removeAttribute("inert");
      } else {
        appRoot.setAttribute("inert", previousInert);
      }
    };
  }, []);

  return createPortal(
    <main
      aria-labelledby={fallbackTitleId}
      className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-background px-4 py-6 sm:px-6"
      ref={fallbackRef}
    >
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
        >
          <Icon className="size-6" strokeWidth={1.75} />
        </div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          id={fallbackTitleId}
          className="mt-6 text-balance text-3xl font-normal tracking-[-0.02em] text-foreground focus:outline-none sm:text-4xl"
        >
          {title}
        </h1>
        <p
          aria-live={alert ? "assertive" : undefined}
          className="mt-3 max-w-[40ch] text-pretty text-sm leading-6 text-foreground/80 sm:text-base"
          role={alert ? "alert" : undefined}
        >
          {description}
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
          {children}
        </div>
      </div>
    </main>,
    document.body,
  );
}

function DashboardLink({ label }: { label: string }) {
  return (
    <Link
      className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
      to="/"
    >
      {label}
    </Link>
  );
}

export function RouteError({ error, info }: ErrorComponentProps) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const loggedErrorRef = useRef<unknown>(null);

  useEffect(() => {
    if (import.meta.env.DEV && loggedErrorRef.current !== error) {
      console.error("[TutorPal route error]", error, info);
      loggedErrorRef.current = error;
    }
  }, [error, info]);

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      await router.invalidate();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <RouteFallbackLayout
      alert
      description={t("routeError.description")}
      icon={TriangleAlert}
      title={t("routeError.title")}
    >
      <Button
        aria-busy={isRetrying}
        className="w-full sm:w-auto"
        disabled={isRetrying}
        loading={isRetrying}
        onClick={() => void handleRetry()}
        type="button"
      >
        {isRetrying ? t("routeError.retrying") : t("routeError.retry")}
      </Button>
      <DashboardLink label={t("routeError.dashboard")} />
    </RouteFallbackLayout>
  );
}

export function RouteNotFound() {
  const { t } = useTranslation("common");

  return (
    <RouteFallbackLayout
      description={t("notFound.description")}
      icon={FileQuestion}
      title={t("notFound.title")}
    >
      <DashboardLink label={t("notFound.dashboard")} />
    </RouteFallbackLayout>
  );
}
