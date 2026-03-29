import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow hover:bg-primary/90",
        destructive: "bg-error text-on-error shadow-sm hover:bg-error/90",
        gradient:
          "bg-gradient-to-br from-primary to-primary-container text-white shadow hover:opacity-90",
        outline:
          "border-2 border-primary text-primary bg-transparent hover:bg-primary/5 active:scale-95 transform transition-transform",
        secondary:
          "bg-surface-container-highest text-on-surface shadow-sm hover:bg-surface-bright active:scale-95 transform transition-transform",
        ghost:
          "text-primary hover:bg-primary/10 active:scale-95 transform transition-transform",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-6 py-4 text-base rounded-xl [&_svg]:size-4",
        sm: "px-4 py-2 text-xs rounded-lg [&_svg]:size-3.5",
        lg: "px-8 py-4 text-lg rounded-xl [&_svg]:size-5",
        icon: "size-12 rounded-full [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className={cn("animate-spin")} />}
        {!loading && LeftIcon && <LeftIcon />}
        {children}
        {RightIcon && <RightIcon />}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
