import { Pencil, Plus, Save } from "lucide-react";
import { type ComponentProps, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ClassForm,
  type ClassFormMode,
} from "@/components/classes/create-class-form";
import { Button } from "@/components/ui/button";
import { ResponsiveDrawer, type DrawerMode } from "@/components/ui/responsive-drawer";
import type { Class } from "@/models/class";
import type { Course } from "@/models/course";

export type { DrawerMode } from "@/components/ui/responsive-drawer";

interface ClassDrawerProps {
  classData: Class | null;
  courses?: Course[];
  isOpen: boolean;
  mode: DrawerMode;
  onCloseAutoFocus?: () => void;
  onModeChange?: (mode: DrawerMode) => void;
  onOpenChange: (open: boolean) => void;
}

export function ClassDrawer({
  classData,
  courses = [],
  isOpen,
  mode,
  onCloseAutoFocus,
  onModeChange,
  onOpenChange,
}: ClassDrawerProps) {
  const { t } = useTranslation(["classes"]);
  const formId = `class-drawer-form-${useId()}`;
  const [isPending, setIsPending] = useState(false);

  const getTitle = () => {
    switch (mode) {
      case "create":
        return t("classes:drawer.createTitle");
      case "view":
        return t("classes:drawer.viewTitle");
      case "edit":
        return t("classes:drawer.editTitle");
      default:
        return "";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "create":
        return t("classes:form.submit");
      case "edit":
        return t("classes:drawer.updateButton");
      default:
        return "";
    }
  };

  const handleOpenChange: NonNullable<
    ComponentProps<typeof ResponsiveDrawer>["onOpenChange"]
  > = (open, eventDetails) => {
    if (!open && isPending) {
      eventDetails?.preventUnmountOnClose();
      return;
    }
    if (!open) setIsPending(false);
    onOpenChange(open);
  };

  const handleSuccess = () => {
    setIsPending(false);
    onOpenChange(false);
    if (mode === "edit") onModeChange?.("view");
  };

  const footer =
    mode === "view" ? (
      <Button
        className="w-full md:w-fit"
        leftIcon={Pencil}
        onClick={() => onModeChange?.("edit")}
        type="button"
      >
        {t("classes:drawer.editButton")}
      </Button>
    ) : (
      <Button
        className="w-full md:w-fit"
        form={formId}
        leftIcon={mode === "create" ? Plus : Save}
        loading={isPending}
        type="submit"
      >
        {getSubmitButtonText()}
      </Button>
    );

  return (
    <ResponsiveDrawer
      footer={footer}
      onCloseAutoFocus={onCloseAutoFocus}
      onOpenChange={handleOpenChange}
      open={isOpen}
      title={getTitle()}
    >
      <ClassForm
        classData={classData}
        courses={courses}
        formId={formId}
        isOpen={isOpen}
        mode={mode as ClassFormMode}
        onPendingChange={setIsPending}
        onSuccess={handleSuccess}
      />
    </ResponsiveDrawer>
  );
}
