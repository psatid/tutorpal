import * as React from "react";
import { Drawer as DrawerPrimitive } from "@animate-ui/react/primitives/base-ui/drawer";
import type { Transition } from "motion/react";

import { cn } from "../lib/utils";
import { overlayLayers } from "./overlay-layers";

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

const drawerTransition = { duration: 0.2, ease: "easeOut" } satisfies Transition;
const drawerExitTransition = { duration: 0.15, ease: "easeIn" } satisfies Transition;

function DrawerRoot({
  swipeDirection,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      swipeDirection={swipeDirection}
      {...props}
    />
  );
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerBackdrop({
  className,
  layer = "base",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Backdrop> & { layer?: DrawerLayer }) {
  const { style, ...backdropProps } = props;
  const backdropClassName = cn(
    "fixed inset-0 bg-overlay-navy/45",
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
    <DrawerPrimitive.Backdrop
      data-slot="drawer-backdrop"
      className={backdropClassName}
      exitTransition={drawerExitTransition}
      transition={drawerTransition}
      {...props}
    />
  );
}

function DrawerViewport({
  className,
  layer = "base",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Viewport> & { layer?: DrawerLayer }) {
  return (
    <DrawerPrimitive.Viewport
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

type DrawerPopupProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Popup> & {
  layer?: DrawerLayer;
  showHandle?: boolean;
};

const DrawerPopup = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Popup>,
  DrawerPopupProps
>(function DrawerPopup({ className, children, layer = "base", showHandle = true, ...props }, ref) {
  return (
    <DrawerPrimitive.Popup
      ref={ref}
      data-slot="drawer-popup"
      className={cn(
        `fixed inset-x-0 bottom-0 flex max-h-[min(85dvh,44rem)] flex-col rounded-t-xl border border-border bg-popover text-popover-foreground shadow-transient-dialog outline-none
        md:inset-y-0 md:right-0 md:left-auto md:w-[min(26rem,100vw)] md:max-h-none md:rounded-none md:border-y-0 md:border-r-0`,
        drawerLayerClasses[layer].popup,
        className,
      )}
      {...props}
      exitTransition={drawerExitTransition}
      transition={drawerTransition}
    >
      {showHandle ? (
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-input-hover md:hidden" />
      ) : null}
      {children}
    </DrawerPrimitive.Popup>
  );
});

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(function DrawerContent({ className, ...props }, ref) {
  return (
    <DrawerPrimitive.Content
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
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        "font-headline text-lg font-normal tracking-[-0.01em] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
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
