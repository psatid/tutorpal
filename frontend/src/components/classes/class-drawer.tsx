import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Save, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RHFInputField } from "@/components/ui/form/rhf";
import { ResponsiveDrawer, type DrawerMode } from "@/components/ui/responsive-drawer";
import { Button } from "@/components/ui/button";
import { useCreateClass } from "@/hooks/mutations/use-create-class";
import { useUpdateClass } from "@/hooks/mutations/use-update-class";
import { useStudents } from "@/hooks/queries/use-students";
import { Class } from "@/models/class";
import { classSchema, type ClassFormData } from "@/types/class";
import { StudentSelectorAccordion } from "./student-selector-accordion";

export type { DrawerMode } from "@/components/ui/responsive-drawer";

interface ClassDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  classData: Class | null;
  onModeChange: (mode: DrawerMode) => void;
}

const CLASS_DRAWER_FORM_ID = "class-drawer-form";

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

  const { data: studentsData } = useStudents();

  const students = studentsData?.students ?? [];

  const selectedStudentIds = form.watch("studentIds") || [];
  const selectedStudents =
    students.filter((student) => selectedStudentIds.includes(student.getId())) || [];

  useEffect(() => {
    if (isOpen && classData && (mode === "view" || mode === "edit")) {
      const data = classData.getFormData();
      form.reset({
        name: data.name,
        totalHours: data.totalHours,
        studentIds: data.studentIds,
      });
    } else if (isOpen && mode === "create") {
      form.reset({
        name: "",
        totalHours: 0,
        studentIds: [],
      });
    }
  }, [isOpen, classData, mode, form]);

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
      createMutation.mutate({ ...data, courseId: null });
    } else if (mode === "edit" && classData) {
      updateMutation.mutate({ id: classData.getId(), data });
    }
  };

  const isDisabled = mode === "view";

  const handleRemoveStudent = (studentId: string) => {
    const currentIds = form.getValues("studentIds") || [];
    form.setValue(
      "studentIds",
      currentIds.filter((id) => id !== studentId),
      { shouldValidate: true },
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

  const footer =
    mode === "view" ? (
      <Button
        className="w-full md:w-fit"
        leftIcon={Pencil}
        onClick={() => onModeChange("edit")}
        type="button"
      >
        {t("classes:drawer.editButton")}
      </Button>
    ) : (
      <Button
        className="w-full md:w-fit"
        form={CLASS_DRAWER_FORM_ID}
        leftIcon={mode === "create" ? Plus : Save}
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
        id={CLASS_DRAWER_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
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
          inputMode: "decimal",
          placeholder: t("classes:drawer.totalHours.placeholder"),
        }}
      />

      {/* Student Selection Field */}
      <div className="space-y-2">
        <p className="font-label font-semibold text-on-surface text-base tracking-wide">
          {t("classes:drawer.students.label")}
        </p>
        <p className="font-caption text-on-surface-variant text-sm">
          {t("classes:drawer.students.caption")}
        </p>

        {/* Selected Students Tags */}
        {selectedStudents.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedStudents.map((student) => (
              <span
                key={student.getId()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-secondary-container text-on-secondary-container"
              >
                {student.getName()}
                {!isDisabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(student.getId())}
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
	  </form>
    </ResponsiveDrawer>
  );
}
