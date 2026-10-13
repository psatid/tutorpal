import { type CSSProperties, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPopup,
  DrawerPortal,
  DrawerTitle,
  DrawerViewport,
} from "@/components/ui/drawer";
import { DrawerOverlayPortalContext } from "@/components/ui/drawer-overlay-portal-context";
import { overlayLayers } from "@/components/ui/overlay-layers";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export type DrawerMode = "create" | "view" | "edit";
type DrawerLayer = "base" | "nested";
type DrawerOpenChangeEventDetails = Parameters<
  NonNullable<React.ComponentProps<typeof Drawer>["onOpenChange"]>
>[1];

interface ResponsiveDrawerProps {
  open: boolean;
  onOpenChange: (
    open: boolean,
    eventDetails?: DrawerOpenChangeEventDetails,
  ) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  headerContent?: ReactNode;
  layer?: DrawerLayer;
  onCloseAutoFocus?: () => void;
  coverContent?: boolean;
  popupStyle?: CSSProperties;
  contentClassName?: string;
}

export function ResponsiveDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  headerContent,
  layer = "base",
  onCloseAutoFocus,
  coverContent = false,
  popupStyle,
  contentClassName,
}: ResponsiveDrawerProps) {
  const { t } = useTranslation("common");
  const [drawerPopup, setDrawerPopup] = useState<HTMLDivElement | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const overlayPortalContextValue = {
    portalContainer: drawerPopup,
    // On small screens the Select must participate in the drawer's modal
    // focus management. The desktop panel does not need that second trap.
    modal: !isDesktop,
  };
  const handleOpenChange: NonNullable<
    React.ComponentProps<typeof Drawer>["onOpenChange"]
  > = (nextOpen, eventDetails) => onOpenChange(nextOpen, eventDetails);
  const dismissNestedDrawer = () => {
    if (layer === "nested") onOpenChange(false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) onCloseAutoFocus?.();
      }}
      swipeDirection={isDesktop ? "right" : "down"}
    >
      <DrawerPortal>
        <DrawerBackdrop
          layer={layer}
          onClick={dismissNestedDrawer}
          onPointerDown={dismissNestedDrawer}
        />
        <DrawerViewport
          layer={layer}
          className={layer === "nested" ? "pointer-events-none" : undefined}
        >
          <DrawerPopup
            ref={setDrawerPopup}
            layer={layer}
            className="pointer-events-auto"
            style={popupStyle}
          >
            <DrawerOverlayPortalContext.Provider
              value={overlayPortalContextValue}
            >
              <DrawerHeader className="px-5 pt-5 pb-4 md:px-6 md:pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <DrawerTitle className="text-balance text-xl font-normal tracking-[-0.02em] md:text-2xl">
                      {title}
                    </DrawerTitle>
                    {description ? (
                      <DrawerDescription className="mt-1 text-pretty">
                        {description}
                      </DrawerDescription>
                    ) : null}
                  </div>
                  <DrawerClose
                    aria-label={t("accessibility.closeNamed", { title })}
                    className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <X className="size-5" />
                  </DrawerClose>
                </div>
                {headerContent ? (
                  <div className="mt-4">{headerContent}</div>
                ) : null}
              </DrawerHeader>
              <DrawerContent className={cn("px-5 md:px-6", contentClassName)}>
                {children}
              </DrawerContent>
              {footer ? (
                <DrawerFooter className="items-stretch border-t border-border bg-popover px-5 py-4 md:items-end md:px-6">
                  {footer}
                </DrawerFooter>
              ) : null}
            </DrawerOverlayPortalContext.Provider>
            {coverContent ? (
              <div
                aria-hidden="true"
                className={`pointer-events-auto absolute inset-0 bg-overlay-navy/25 ${overlayLayers.nestedBackdrop}`}
              />
            ) : null}
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  );
}
