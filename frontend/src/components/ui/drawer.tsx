import * as React from "react";
import { Drawer } from "@base-ui/react/drawer";

import { cn } from "@/lib/utils";

function DrawerRoot({ ...props }: React.ComponentProps<typeof Drawer.Root>) {
  return <Drawer.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof Drawer.Trigger>) {
  return <Drawer.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof Drawer.Portal>) {
  return <Drawer.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof Drawer.Close>) {
  return <Drawer.Close data-slot="drawer-close" {...props} />;
}

function DrawerBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Backdrop>) {
  return (
    <Drawer.Backdrop
      data-slot="drawer-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-all duration-300 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0",
        className
      )}
      {...props}
    />
  );
}

function DrawerViewport({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Viewport>) {
  return (
    <Drawer.Viewport
      data-slot="drawer-viewport"
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center",
        className
      )}
      {...props}
    />
  );
}

const DrawerPopup = React.forwardRef<
  React.ElementRef<typeof Drawer.Popup>,
  React.ComponentPropsWithoutRef<typeof Drawer.Popup>
>(function DrawerPopup({ className, children, ...props }, ref) {
  return (
    <Drawer.Popup
      ref={ref}
      data-slot="drawer-popup"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-popover text-popover-foreground shadow-xl outline-none transition-transform duration-300 ease-out data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
      {children}
    </Drawer.Popup>
  );
});

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof Drawer.Content>,
  React.ComponentPropsWithoutRef<typeof Drawer.Content>
>(function DrawerContent({ className, ...props }, ref) {
  return (
    <Drawer.Content
      ref={ref}
      data-slot="drawer-content"
      className={cn("flex-1 overflow-y-auto px-6 pb-6", className)}
      {...props}
    />
  );
});

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1.5 px-6 pb-4", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Title>) {
  return (
    <Drawer.Title
      data-slot="drawer-title"
      className={cn(
        "font-headline font-bold text-lg text-foreground",
        className
      )}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Description>) {
  return (
    <Drawer.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  DrawerRoot as Drawer,
  DrawerBackdrop,
  DrawerViewport,
  DrawerPopup,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
};
