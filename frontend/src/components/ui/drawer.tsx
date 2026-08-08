import * as React from "react";
import { Drawer } from "@base-ui/react/drawer";

import { cn } from "@/lib/utils";
import { overlayLayers } from "@/components/ui/overlay-layers";

type DrawerLayer = "base" | "nested";

const drawerLayerClasses: Record<
  DrawerLayer,
  { backdrop: string; viewport: string; popup: string }
> = {
  base: {
    backdrop: overlayLayers.baseBackdrop,
    viewport: overlayLayers.baseSurface,
    popup: overlayLayers.baseSurface,
  },
  nested: {
    backdrop: overlayLayers.nestedBackdrop,
    viewport: overlayLayers.nestedSurface,
    popup: overlayLayers.nestedSurface,
  },
};

function DrawerRoot({
  swipeDirection,
  ...props
}: React.ComponentProps<typeof Drawer.Root>) {
  return (
    <Drawer.Root
      data-slot="drawer"
      swipeDirection={swipeDirection}
      {...props}
    />
  );
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
  layer = "base",
  ...props
}: React.ComponentProps<typeof Drawer.Backdrop> & { layer?: DrawerLayer }) {
  const { style, ...backdropProps } = props;
  const backdropClassName = cn(
    "fixed inset-0 bg-black/40 backdrop-blur-xs transition-all duration-300 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0",
    drawerLayerClasses[layer].backdrop,
    className,
  );

  if (layer === "nested") {
    return (
      <div
        aria-hidden="true"
        data-slot="drawer-backdrop"
        className={backdropClassName}
        style={typeof style === "function" ? undefined : style}
        {...backdropProps}
      />
    );
  }

  return (
    <Drawer.Backdrop
      data-slot="drawer-backdrop"
      className={backdropClassName}
      {...props}
    />
  );
}

function DrawerViewport({
  className,
  layer = "base",
  ...props
}: React.ComponentProps<typeof Drawer.Viewport> & { layer?: DrawerLayer }) {
  return (
    <Drawer.Viewport
      data-slot="drawer-viewport"
      className={cn(
        "fixed inset-0 flex items-end justify-center md:items-stretch md:justify-end",
        drawerLayerClasses[layer].viewport,
        className,
      )}
      {...props}
    />
  );
}

type DrawerPopupProps = React.ComponentPropsWithoutRef<typeof Drawer.Popup> & {
  layer?: DrawerLayer;
};

const DrawerPopup = React.forwardRef<
  React.ElementRef<typeof Drawer.Popup>,
  DrawerPopupProps
>(function DrawerPopup({ className, children, layer = "base", ...props }, ref) {
  return (
    <Drawer.Popup
      ref={ref}
      data-slot="drawer-popup"
      className={cn(
        `fixed inset-x-0 bottom-0 flex max-h-[min(85dvh,44rem)] flex-col rounded-t-2xl border border-border bg-popover text-popover-foreground outline-none transition-transform duration-250 ease-out
        data-[swipe-direction=down]:data-starting-style:translate-y-full data-[swipe-direction=down]:data-ending-style:translate-y-full 
        data-[swipe-direction=right]:data-starting-style:translate-x-full data-[swipe-direction=right]:data-ending-style:translate-x-full 
        md:inset-y-0 md:right-0 md:left-auto md:w-[min(26rem,100vw)] md:max-h-none md:rounded-none md:border-y-0 md:border-r-0`,
        drawerLayerClasses[layer].popup,
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted md:hidden" />
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
        className,
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
