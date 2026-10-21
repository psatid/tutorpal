import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type ScreenLayoutProps = ComponentPropsWithoutRef<"div">;

export function ScreenLayout({
  className,
  ...props
}: ScreenLayoutProps) {
  return (
    <div
      className={cn(
        "min-w-0 bg-background p-3 sm:p-4 lg:p-6",
        className,
      )}
      {...props}
    />
  );
}

type ScreenLayoutEdgeProps = ComponentPropsWithoutRef<"div"> & {
  mobileOnly?: boolean;
};

export function ScreenLayoutEdge({
  className,
  mobileOnly = false,
  ...props
}: ScreenLayoutEdgeProps) {
  return (
    <div
      className={cn(
        mobileOnly ? "-mx-3 sm:mx-0" : "-mx-3 sm:-mx-4 lg:-mx-6",
        className,
      )}
      {...props}
    />
  );
}
