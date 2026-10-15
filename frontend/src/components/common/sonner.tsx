import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ExclamationMarkIcon,
  InformationCircleIcon,
  MultiplicationSignIcon,
  Loading03Icon,
  Tick02Icon,
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
          <HugeiconsIcon aria-hidden="true" icon={Tick02Icon} strokeWidth={2} className="size-4" />
        ),
        info: (
          <HugeiconsIcon aria-hidden="true" icon={InformationCircleIcon} strokeWidth={2} className="size-4" />
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
