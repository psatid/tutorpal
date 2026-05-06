import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RHFInputField, RHFSelectField } from "@/components/ui/form/rhf";
import { FormDrawer, type DrawerMode } from "@/components/ui/form-drawer";
import { useCreateStudent } from "@/hooks/mutations/use-create-student";
import { useUpdateStudent } from "@/hooks/mutations/use-update-student";
import { studentSchema, type StudentFormData } from "@/types/student";
import type { GetV1Students200DataItem } from "@/api/generated/models/getV1Students200DataItem";

export type { DrawerMode } from "@/components/ui/form-drawer";

interface StudentDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  student: GetV1Students200DataItem | null;
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
    <FormDrawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      mode={mode}
      onModeChange={onModeChange}
      title={getTitle()}
      editButtonText={t("students:drawer.editButton")}
      submitButtonText={getSubmitButtonText()}
      submitButtonIcon={mode === "create" ? User : Save}
      isLoading={createMutation.isPending || updateMutation.isPending}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={reset}
    >
      <RHFInputField
        control={control}
        name="name"
        label={t("students:drawer.name.label")}
        caption={
          mode === "create" ? t("students:drawer.name.caption") : undefined
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
          mode === "create" ? t("students:drawer.grade.caption") : undefined
        }
        options={gradeOptions}
        disabled={isDisabled}
        selectProps={{
          placeholder: t("students:drawer.grade.placeholder"),
        }}
      />
    </FormDrawer>
  );
}
