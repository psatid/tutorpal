import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type ScreenLayoutProps = ComponentPropsWithoutRef<"div"> & {
  padding?: "default" | "none";
};

export function ScreenLayout({
  className,
  padding = "default",
  ...props
}: ScreenLayoutProps) {
  return (
    <div
      className={cn(
        padding === "default" && "p-3 sm:p-4 lg:p-6",
        className,
      )}
      {...props}
    />
  );
}
