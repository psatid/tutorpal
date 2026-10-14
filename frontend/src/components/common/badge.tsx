import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        primary:
          "border-primary/25 bg-primary-container text-primary-pressed [a]:hover:bg-primary-container/80 dark:border-primary/40 dark:bg-primary/30 dark:text-primary-foreground",
        destructive:
          "border-destructive/25 bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:border-destructive/40 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        success:
          "border-success/25 bg-success-container text-success-container-foreground dark:border-success/40 [a]:hover:bg-success-container/80",
        info:
          "border-info/25 bg-info-container text-info-container-foreground dark:border-info/40 [a]:hover:bg-info-container/80",
        warning:
          "border-warning/25 bg-warning-container text-warning-container-foreground dark:border-warning/40 [a]:hover:bg-warning-container/80",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

function Badge({
  className,
  variant = "primary",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
