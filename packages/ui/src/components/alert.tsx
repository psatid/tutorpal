import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const alertVariants = cva(
  "group/alert grid w-full grid-cols-[minmax(0,1fr)] items-start rounded-lg border text-sm has-[>[data-slot=alert-icon]]:grid-cols-[1.25rem_minmax(0,1fr)] has-[>[data-slot=alert-action]]:grid-cols-[minmax(0,1fr)_auto] has-[>[data-slot=alert-icon]~[data-slot=alert-action]]:grid-cols-[1.25rem_minmax(0,1fr)_auto] [&>[data-slot=alert-icon]]:col-start-1 [&>[data-slot=alert-icon]]:row-start-1 [&>[data-slot=alert-icon]]:row-span-2 [&>[data-slot=alert-icon]]:self-center [&>[data-slot=alert-title]]:col-start-1 [&>[data-slot=alert-title]]:row-start-1 [&>[data-slot=alert-title]]:row-span-2 [&>[data-slot=alert-title]]:self-center [&>[data-slot=alert-description]]:col-start-1 [&>[data-slot=alert-description]]:row-start-1 [&>[data-slot=alert-description]]:row-span-2 [&>[data-slot=alert-description]]:self-center [&>[data-slot=alert-action]]:col-start-2 [&>[data-slot=alert-action]]:row-start-1 [&>[data-slot=alert-action]]:row-span-2 [&>[data-slot=alert-action]]:self-center [&>[data-slot=alert-action]]:justify-self-end has-[>[data-slot=alert-icon]]:[&>[data-slot=alert-title]]:col-start-2 has-[>[data-slot=alert-icon]]:[&>[data-slot=alert-description]]:col-start-2 has-[>[data-slot=alert-icon]~[data-slot=alert-action]]:[&>[data-slot=alert-action]]:col-start-3 has-[>[data-slot=alert-title]~[data-slot=alert-description]]:[&>[data-slot=alert-title]]:row-span-1 has-[>[data-slot=alert-title]~[data-slot=alert-description]]:[&>[data-slot=alert-description]]:row-start-2 has-[>[data-slot=alert-title]~[data-slot=alert-description]]:[&>[data-slot=alert-description]]:row-span-1",
  {
    variants: {
      variant: {
        default:
          "border-border bg-card text-card-foreground *:data-[slot=alert-description]:text-muted-foreground",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive *:data-[slot=alert-description]:text-current",
        warning:
          "border-warning/30 bg-warning-container text-warning-container-foreground *:data-[slot=alert-description]:text-current",
      },
      size: {
        default: "gap-x-3 px-4 py-3",
        compact: "gap-x-2 px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Alert({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      {...props}
      data-slot="alert"
      data-variant={variant}
      data-size={size}
      role="alert"
      className={cn(alertVariants({ size, variant }), className)}
    />
  );
}

function AlertIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      {...props}
      aria-hidden="true"
      data-slot="alert-icon"
      className={cn(
        "flex size-5 shrink-0 items-center justify-center [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-current",
        className,
      )}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "min-w-0 font-medium leading-snug tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "min-w-0 text-sm leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("flex shrink-0 items-center", className)}
      {...props}
    />
  );
}

export {
  Alert,
  AlertAction,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  alertVariants,
};
