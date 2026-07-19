import * as React from "react";

export type DrawerOverlayPortalContextValue = {
  portalContainer: React.RefObject<HTMLElement | null> | HTMLElement | null;
  modal?: boolean;
};

export const DrawerOverlayPortalContext =
  React.createContext<DrawerOverlayPortalContextValue | null>(null);

export function resolveDrawerOverlayPortalContainer(
  context: DrawerOverlayPortalContextValue | null,
): HTMLElement | null {
  if (!context?.portalContainer) {
    return null;
  }

  const { portalContainer } = context;
  return "current" in portalContainer ? portalContainer.current : portalContainer;
}
