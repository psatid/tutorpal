import { useRef } from "react";
import { Pencil, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerPortal,
  DrawerBackdrop,
  DrawerViewport,
  DrawerPopup,
  DrawerContent,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { DrawerSelectPortalContext } from "@/components/ui/select";
import { useMediaQuery } from "@/hooks/use-media-query";

export type DrawerMode = "create" | "view" | "edit";

interface FormDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  title: string;
  submitButtonText: string;
  submitButtonIcon?: LucideIcon;
  isLoading: boolean;
  mode?: DrawerMode;
  onModeChange?: (mode: DrawerMode) => void;
  editButtonText?: string;
}

export function FormDrawer({
  isOpen,
  onOpenChange,
  children,
  onSubmit,
  onCancel,
  title,
  submitButtonText,
  submitButtonIcon: SubmitIcon,
  isLoading,
  mode = "create",
  onModeChange,
  editButtonText,
}: FormDrawerProps) {
  const drawerPopupRef = useRef<HTMLDivElement>(null);
  const desktopPortalRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const selectContextValue = {
    portalContainer: isDesktop ? desktopPortalRef : drawerPopupRef,
    modal: isDesktop ? false : undefined,
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      swipeDirection={isDesktop ? "right" : "down"}
    >
      <DrawerPortal>
        <div
          ref={desktopPortalRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-60"
        />
        <DrawerBackdrop />
        <DrawerViewport>
          <DrawerPopup ref={drawerPopupRef}>
            <DrawerContent>
              <DrawerSelectPortalContext.Provider value={selectContextValue}>
                <div className="flex flex-col h-full">
                  <form onSubmit={onSubmit} className="flex flex-col h-full">
                    <div className="flex items-center justify-between shrink-0 bg-background pb-4 md:pt-4">
                      <div className="flex items-center gap-3">
                        <DrawerTitle className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
                          {title}
                        </DrawerTitle>
                      </div>
                      <DrawerClose className="p-2 -m-2 rounded-full hover:bg-muted transition-colors">
                        <X className="w-5 h-5" />
                      </DrawerClose>
                    </div>

                    <div className="-mx-1 flex-1 overflow-y-auto px-1">
                      <div className="space-y-5">{children}</div>
                    </div>

                    <div className="shrink-0 bg-background pt-4">
                      <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                        {mode === "view" ? (
                          <Button
                            type="button"
                            className="w-full md:w-fit"
                            leftIcon={Pencil}
                            onClick={(e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTimeout(() => onModeChange?.("edit"), 0);
                            }}
                          >
                            {editButtonText ?? "Edit"}
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            className="w-full md:w-fit"
                            loading={isLoading}
                            leftIcon={SubmitIcon}
                          >
                            {submitButtonText}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full md:w-fit"
                          onClick={() => {
                            onCancel();
                            onOpenChange(false);
                          }}
                        >
                          {mode === "view" ? "Close" : "Cancel"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </DrawerSelectPortalContext.Provider>
            </DrawerContent>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  );
}
