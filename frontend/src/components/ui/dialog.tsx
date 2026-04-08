import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogBackdrop = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Backdrop>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Backdrop
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
      "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
      "transition-opacity duration-300",
      className
    )}
    {...props}
  />
));
DialogBackdrop.displayName = "DialogBackdrop";

const DialogPopup = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Popup
    ref={ref}
    className={cn(
      "fixed left-[50%] top-[50%] z-50 w-full max-w-sm md:max-w-md translate-x-[-50%] translate-y-[-50%]",
      "bg-surface-container-lowest rounded-2xl shadow-xl p-6",
      "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
      "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
      "transition-all duration-300 ease-out",
      "outline-none",
      className
    )}
    {...props}
  />
));
DialogPopup.displayName = "DialogPopup";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-headline font-extrabold text-xl text-on-surface",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-on-surface-variant mt-2", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 mt-6 gap-3 sm:gap-0",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogPortal,
  DialogBackdrop,
  DialogClose,
  DialogTrigger,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
};
