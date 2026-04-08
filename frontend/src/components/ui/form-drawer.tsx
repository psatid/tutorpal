import { X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerPortal,
  DrawerBackdrop,
  DrawerViewport,
  DrawerPopup,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";

export interface FormDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  submitButtonText: string;
  cancelButtonText?: string;
  isLoading?: boolean;
  submitButtonIcon?: LucideIcon;
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
}

export function FormDrawer({
  isOpen,
  onOpenChange,
  title,
  children,
  submitButtonText,
  cancelButtonText = "Cancel",
  isLoading = false,
  submitButtonIcon: SubmitIcon,
  onSubmit,
  onCancel,
}: FormDrawerProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerBackdrop />
        <DrawerViewport>
          <DrawerPopup>
            <DrawerContent>
              <div className="w-12 h-1.5 bg-surface-variant rounded-full mx-auto my-4" />

              <div className="px-8 pb-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
                    {title}
                  </h2>
                  <DrawerClose>
                    <X className="w-6 h-6" />
                  </DrawerClose>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                  {children}

                  <div className="pt-4 space-y-3">
                    <Button
                      type="submit"
                      className="w-full"
                      loading={isLoading}
                      leftIcon={SubmitIcon}
                    >
                      {submitButtonText}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={handleCancel}
                    >
                      {cancelButtonText}
                    </Button>
                  </div>
                </form>
              </div>
            </DrawerContent>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  );
}
