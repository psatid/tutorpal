import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { cn } from "@/lib/utils";

const Drawer = DrawerPrimitive.Root;

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerClose = DrawerPrimitive.Close;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerBackdrop = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Backdrop>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Backdrop
    ref={ref}
    className={cn(
      "fixed inset-0 bg-black/40 backdrop-blur-[2px] z-60",
      "data-starting-style:opacity-0 data-ending-style:opacity-0",
      "transition-opacity duration-300",
      className
    )}
    {...props}
  />
));
DrawerBackdrop.displayName = "DrawerBackdrop";

const DrawerViewport = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed inset-x-0 bottom-0 z-70 flex flex-col items-center",
      className
    )}
    {...props}
  />
));
DrawerViewport.displayName = "DrawerViewport";

const DrawerPopup = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Popup>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Popup
    ref={ref}
    className={cn(
      "w-full bg-surface-container-lowest rounded-t-4xl shadow-[0px_-16px_48px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto",
      "data-starting-style:translate-y-full data-ending-style:translate-y-full",
      "transition-transform duration-300 ease-out",
      className
    )}
    {...props}
  />
));
DrawerPopup.displayName = "DrawerPopup";

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Content
    ref={ref}
    className={cn("p-0", className)}
    {...props}
  />
));
DrawerContent.displayName = "DrawerContent";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "font-headline font-extrabold text-2xl text-on-surface tracking-tight",
      className
    )}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-on-surface-variant", className)}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerBackdrop,
  DrawerViewport,
  DrawerPopup,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
};
