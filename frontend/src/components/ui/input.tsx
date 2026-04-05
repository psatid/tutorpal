import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: LucideIcon;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon: LeftIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {LeftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant">
              <LeftIcon className="w-5 h-5" />
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex w-full rounded-lg border bg-surface-container-low text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              LeftIcon ? "px-12 py-3.5" : "px-4 py-3.5",
              error
                ? "border-error focus-visible:border-error"
                : "border-outline-variant focus-visible:border-primary",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-error text-sm mt-1 font-body">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
