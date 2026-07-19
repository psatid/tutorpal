import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type InputProps = React.ComponentProps<"input"> & {
  leftIcon?: LucideIcon;
  rightAdornment?: React.ReactNode;
};

function Input({
  className,
  type,
  leftIcon: LeftIcon,
  rightAdornment,
  ...props
}: InputProps) {
  const input = (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-input/30 px-3 py-1 text-base transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-primary/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        LeftIcon && "pl-9",
        rightAdornment && "pr-11",
        className,
      )}
      {...props}
    />
  );

  if (!LeftIcon && !rightAdornment) {
    return input;
  }

  return (
    <div className="relative w-full">
      {LeftIcon ? (
        <LeftIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      ) : null}
      {input}
      {rightAdornment ? (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {rightAdornment}
        </div>
      ) : null}
    </div>
  );
}

export { Input };
