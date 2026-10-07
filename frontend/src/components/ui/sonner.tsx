import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ExclamationMarkIcon,
  MultiplicationSignIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import "./sonner.css";

const Toaster = ({ ...props }: ToasterProps) => {
  const { t } = useTranslation("common");

  return (
    <Sonner
      theme="system"
      className="toaster group"
      closeButton
      mobileOffset={12}
      offset={16}
      icons={{
        success: (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none">
            <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        info: (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none">
            <path d="M12 11v5m0-8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ),
        warning: (
          <HugeiconsIcon
            aria-hidden="true"
            icon={ExclamationMarkIcon}
            strokeWidth={2.5}
            className="size-4"
          />
        ),
        error: (
          <HugeiconsIcon
            aria-hidden="true"
            icon={MultiplicationSignIcon}
            strokeWidth={2}
            className="size-4"
          />
        ),
        loading: (
          <HugeiconsIcon
            aria-hidden="true"
            icon={Loading03Icon}
            strokeWidth={2}
            className="size-4 animate-spin"
          />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      toastOptions={{
        closeButtonAriaLabel: t("accessibility.close"),
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
