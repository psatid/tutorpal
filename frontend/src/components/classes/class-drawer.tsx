import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RHFInputField } from "@/components/ui/form/rhf";
import { FormDrawer, type DrawerMode } from "@/components/ui/form-drawer";
import { useCreateClass } from "@/hooks/mutations/use-create-class";
import { useUpdateClass } from "@/hooks/mutations/use-update-class";
import { useStudents } from "@/hooks/queries/use-students";
import { classSchema, type ClassFormData, type Class } from "@/types/class";
import { StudentSelectorAccordion } from "./student-selector-accordion";

export type { DrawerMode } from "@/components/ui/form-drawer";

interface ClassDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  classData: Class | null;
  onModeChange: (mode: DrawerMode) => void;
}

export function ClassDrawer({
  isOpen,
  onOpenChange,
  mode,
  classData,
  onModeChange,
}: ClassDrawerProps) {
  const { t } = useTranslation(["classes"]);
  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      totalHours: 0,
      studentIds: [],
    },
  });

  const { data: students } = useStudents();

  const selectedStudentIds = form.watch("studentIds") || [];
  const selectedStudents =
    students?.filter((student) => selectedStudentIds.includes(student.id)) ||
    [];

  useEffect(() => {
    if (classData && (mode === "view" || mode === "edit")) {
      form.reset({
        name: classData.name,
        totalHours: classData.totalHours,
        studentIds: classData.students.map((s) => s.id),
      });
    } else if (mode === "create") {
      form.reset({
        name: "",
        totalHours: 0,
        studentIds: [],
      });
    }
  }, [classData, mode, form]);

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        name: "",
        totalHours: 0,
        studentIds: [],
      });
    }
  }, [isOpen, form]);

  const createMutation = useCreateClass({
    onSuccess: () => {
      form.reset();
      onOpenChange(false);
    },
  });

  const updateMutation = useUpdateClass({
    onSuccess: () => {
      onOpenChange(false);
      onModeChange("view");
    },
  });

  const onSubmit = (data: ClassFormData) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else if (mode === "edit" && classData) {
      updateMutation.mutate({ id: classData.id, data });
    }
  };

  const isDisabled = mode === "view";

  const handleRemoveStudent = (studentId: string) => {
    const currentIds = form.getValues("studentIds") || [];
    form.setValue(
      "studentIds",
      currentIds.filter((id) => id !== studentId),
      { shouldValidate: true }
    );
  };

  const handleStudentSelectionChange = (newSelectedIds: string[]) => {
    form.setValue("studentIds", newSelectedIds, { shouldValidate: true });
  };

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

  return (
    <FormDrawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      mode={mode}
      onModeChange={onModeChange}
      title={getTitle()}
      editButtonText={t("classes:drawer.editButton")}
      submitButtonText={getSubmitButtonText()}
      submitButtonIcon={mode === "create" ? Plus : Save}
      isLoading={createMutation.isPending || updateMutation.isPending}
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={form.reset}
    >
      <RHFInputField
        control={form.control}
        name="name"
        label={t("classes:drawer.name.label")}
        caption={
          mode === "create" ? t("classes:drawer.name.caption") : undefined
        }
        disabled={isDisabled}
        inputProps={{
          type: "text",
          placeholder: t("classes:drawer.name.placeholder"),
        }}
      />

      <RHFInputField
        control={form.control}
        name="totalHours"
        label={t("classes:drawer.totalHours.label")}
        caption={
          mode === "create" ? t("classes:drawer.totalHours.caption") : undefined
        }
        disabled={isDisabled}
        inputProps={{
          type: "number",
          placeholder: t("classes:drawer.totalHours.placeholder"),
          min: 1,
        }}
      />

      {/* Student Selection Field */}
      <div className="space-y-2">
        <label className="font-label font-semibold text-on-surface text-base tracking-wide">
          {t("classes:drawer.students.label")}
        </label>
        <p className="font-caption text-on-surface-variant text-sm">
          {t("classes:drawer.students.caption")}
        </p>

        {/* Selected Students Tags */}
        {selectedStudents.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedStudents.map((student) => (
              <span
                key={student.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-secondary-container text-on-secondary-container"
              >
                {student.name}
                {!isDisabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(student.id)}
                    className="p-0.5 rounded-full hover:bg-on-secondary-container/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Student Selector Accordion */}
        {!isDisabled && (
          <StudentSelectorAccordion
            selectedIds={selectedStudentIds}
            onChange={handleStudentSelectionChange}
          />
        )}
      </div>
    </FormDrawer>
  );
}
