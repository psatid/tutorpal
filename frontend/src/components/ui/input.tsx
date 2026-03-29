import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex w-full rounded-lg border bg-surface-container-low px-4 py-3.5 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            error
              ? "border-error focus-visible:border-error"
              : "border-outline-variant focus-visible:border-primary",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-error text-sm mt-1 font-body">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
