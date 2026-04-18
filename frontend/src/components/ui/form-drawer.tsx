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
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerBackdrop />
        <DrawerViewport>
          <DrawerPopup>
            <DrawerContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <DrawerTitle className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
                    {title}
                  </DrawerTitle>
                </div>
                <DrawerClose className="p-2 -m-2 rounded-full hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </DrawerClose>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                {children}

                <div className="pt-4 space-y-3">
                  {mode === "view" ? (
                    <Button
                      type="button"
                      className="w-full"
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
                      className="w-full"
                      loading={isLoading}
                      leftIcon={SubmitIcon}
                    >
                      {submitButtonText}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      onCancel();
                      onOpenChange(false);
                    }}
                  >
                    {mode === "view" ? "Close" : "Cancel"}
                  </Button>
                </div>
              </form>
            </DrawerContent>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  );
}
