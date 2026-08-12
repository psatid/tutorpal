import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Save, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RHFInputField, RHFSelectField } from "@/components/ui/form/rhf";
import { ResponsiveDrawer, type DrawerMode } from "@/components/ui/responsive-drawer";
import { Button } from "@/components/ui/button";
import { useCreateStudent } from "@/hooks/mutations/use-create-student";
import { useUpdateStudent } from "@/hooks/mutations/use-update-student";
import { Student } from "@/models/student";
import { createStudentSchema, type StudentFormData } from "@/types/student";

export type { DrawerMode } from "@/components/ui/responsive-drawer";

interface StudentDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  student: Student | null;
  onModeChange: (mode: DrawerMode) => void;
}

const STUDENT_DRAWER_FORM_ID = "student-drawer-form";

export function StudentDrawer({
  isOpen,
  onOpenChange,
  mode,
  student,
  onModeChange,
}: StudentDrawerProps) {
  const { t } = useTranslation(["students"]);
  const gradeOptions = ["6", "7", "8", "9", "10", "11", "12"].map(
    (grade) => ({ value: grade, label: t("students:grade", { grade }) }),
  );
  const { handleSubmit, reset, control } = useForm<StudentFormData>({
    resolver: zodResolver(createStudentSchema(t)),
    defaultValues: {
      name: "",
      phone: "",
      grade: undefined,
    },
  });

  useEffect(() => {
    if (isOpen && student && (mode === "view" || mode === "edit")) {
      const data = student.getFormData();
      reset({
        name: data.name,
        phone: data.phoneNumber || "",
        grade: data.grade.toString() as StudentFormData["grade"],
      });
    } else if (isOpen && mode === "create") {
      reset({
        name: "",
        phone: "",
        grade: undefined,
      });
    }
  }, [isOpen, student, mode, reset]);

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
      updateMutation.mutate({ studentId: student.getId(), data });
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

  const footer =
    mode === "view" ? (
      <Button
        className="w-full md:w-fit"
        leftIcon={Pencil}
        onClick={() => onModeChange("edit")}
        type="button"
      >
        {t("students:drawer.editButton")}
      </Button>
    ) : (
      <Button
        className="w-full md:w-fit"
        form={STUDENT_DRAWER_FORM_ID}
        leftIcon={mode === "create" ? User : Save}
        loading={createMutation.isPending || updateMutation.isPending}
        type="submit"
      >
        {getSubmitButtonText()}
      </Button>
    );

  return (
	<ResponsiveDrawer
      footer={footer}
      onOpenChange={onOpenChange}
      open={isOpen}
      title={getTitle()}
    >
      <form
        className="flex flex-col gap-5"
        id={STUDENT_DRAWER_FORM_ID}
        onSubmit={handleSubmit(onSubmit)}
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
	  </form>
    </ResponsiveDrawer>
  );
}
