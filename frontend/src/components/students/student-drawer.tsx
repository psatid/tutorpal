import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Save, Eye, Plus, X, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RHFInputField, RHFSelectField } from "@/components/ui/form/rhf";
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
import { useCreateStudent } from "@/hooks/mutations/use-create-student";
import { useUpdateStudent } from "@/hooks/mutations/use-update-student";
import { studentSchema, type StudentFormData } from "@/types/student";
import type { GetV1Students200Item } from "@/api/generated/models/getV1Students200Item";

export type DrawerMode = "create" | "view" | "edit";

interface StudentDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  student: GetV1Students200Item | null;
  onModeChange: (mode: DrawerMode) => void;
}

const gradeOptions = [
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
];

export function StudentDrawer({
  isOpen,
  onOpenChange,
  mode,
  student,
  onModeChange,
}: StudentDrawerProps) {
  const { t } = useTranslation(["students"]);
  const { handleSubmit, reset, control } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      phone: "",
      grade: undefined,
    },
  });

  useEffect(() => {
    if (student && (mode === "view" || mode === "edit")) {
      reset({
        name: student.name,
        phone: student.phoneNumber || "",
        grade: student.grade.toString() as StudentFormData["grade"],
      });
    } else if (mode === "create") {
      reset({
        name: "",
        phone: "",
        grade: undefined,
      });
    }
  }, [student, mode, reset]);

  useEffect(() => {
    if (!isOpen) {
      reset({
        name: "",
        phone: "",
        grade: undefined,
      });
    }
  }, [isOpen, reset]);

  const createMutation = useCreateStudent({
    onSuccess: () => {
      reset();
      onOpenChange(false);
    },
  });

  const updateMutation = useUpdateStudent({
    onSuccess: () => {
      onOpenChange(false);
      onModeChange("view");
    },
  });

  const onSubmit = (data: StudentFormData) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else if (mode === "edit" && student) {
      updateMutation.mutate({ studentId: student.id, data });
    }
  };

  const isDisabled = mode === "view";

  const getTitle = () => {
    switch (mode) {
      case "create":
        return t("students:drawer.createTitle");
      case "view":
        return t("students:drawer.viewTitle");
      case "edit":
        return t("students:drawer.editTitle");
      default:
        return "";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "create":
        return t("students:drawer.createButton");
      case "edit":
        return t("students:drawer.updateButton");
      default:
        return "";
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerBackdrop />
        <DrawerViewport>
          <DrawerPopup>
            <DrawerContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {mode === "create" && (
                    <Plus className="w-5 h-5 text-primary" />
                  )}
                  {mode === "view" && (
                    <Eye className="w-5 h-5 text-primary" />
                  )}
                  {mode === "edit" && (
                    <Pencil className="w-5 h-5 text-primary" />
                  )}
                  <DrawerTitle className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
                    {getTitle()}
                  </DrawerTitle>
                </div>
                <DrawerClose className="p-2 -m-2 rounded-full hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </DrawerClose>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <RHFInputField
                  control={control}
                  name="name"
                  label={t("students:drawer.name.label")}
                  caption={
                    mode === "create"
                      ? t("students:drawer.name.caption")
                      : undefined
                  }
                  disabled={isDisabled}
                  inputProps={{
                    type: "text",
                    placeholder: t("students:drawer.name.placeholder"),
                  }}
                />

                <RHFInputField
                  control={control}
                  name="phone"
                  label={t("students:drawer.phone.label")}
                  caption={t("students:drawer.phone.caption")}
                  disabled={isDisabled}
                  inputProps={{
                    type: "tel",
                    placeholder: t("students:drawer.phone.placeholder"),
                  }}
                />

                <RHFSelectField
                  control={control}
                  name="grade"
                  label={t("students:drawer.grade.label")}
                  caption={
                    mode === "create"
                      ? t("students:drawer.grade.caption")
                      : undefined
                  }
                  options={gradeOptions}
                  disabled={isDisabled}
                  selectProps={{
                    placeholder: t("students:drawer.grade.placeholder"),
                  }}
                />

                <div className="pt-4 space-y-3">
                  {mode === "view" ? (
                    <Button
                      type="button"
                      className="w-full"
                      leftIcon={Pencil}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTimeout(() => onModeChange("edit"), 0);
                      }}
                    >
                      {t("students:drawer.editButton")}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="w-full"
                      loading={
                        createMutation.isPending || updateMutation.isPending
                      }
                      leftIcon={mode === "create" ? User : Save}
                    >
                      {getSubmitButtonText()}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => onOpenChange(false)}
                  >
                    {mode === "view"
                      ? t("students:drawer.closeButton")
                      : t("students:drawer.cancelButton")}
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
