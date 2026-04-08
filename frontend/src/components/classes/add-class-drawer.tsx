import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ChevronRight, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormDrawer } from "@/components/ui/form-drawer";
import { RHFInputField } from "@/components/form/rhf";
import { useCreateClass } from "@/hooks/mutations/use-create-class";
import { useStudents } from "@/hooks/queries/use-students";
import { classSchema, type ClassFormData } from "@/types/class";
import { StudentSelectorDrawer } from "./student-selector-drawer";

interface AddClassDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultValues: ClassFormData = {
  name: "",
  totalHours: 0,
  studentIds: [],
};

export function AddClassDrawer({ isOpen, onOpenChange }: AddClassDrawerProps) {
  const { t } = useTranslation(["classes"]);
  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues,
  });

  const [isStudentSelectorOpen, setIsStudentSelectorOpen] = useState(false);
  const { data: students } = useStudents();

  // Watch studentIds from form
  const selectedStudentIds = form.watch("studentIds") || [];

  // Get selected student objects for display
  const selectedStudents =
    students?.filter((student) => selectedStudentIds.includes(student.id)) ||
    [];

  const mutation = useCreateClass({
    onSuccess: () => {
      form.reset();
      onOpenChange(false);
    },
  });

  const onSubmit = (data: ClassFormData) => {
    mutation.mutate(data);
  };

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

  return (
    <>
      <FormDrawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t("classes:form.addTitle")}
        submitButtonText={t("classes:form.submit")}
        submitButtonIcon={Plus}
        isLoading={mutation.isPending}
        onSubmit={form.handleSubmit(onSubmit)}
        onCancel={() => form.reset()}
      >
        <RHFInputField
          control={form.control}
          name="name"
          label={t("classes:form.name.label")}
          caption={t("classes:form.name.caption")}
          inputProps={{
            type: "text",
            placeholder: t("classes:form.name.placeholder"),
          }}
        />

        <RHFInputField
          control={form.control}
          name="totalHours"
          label={t("classes:form.totalHours.label")}
          caption={t("classes:form.totalHours.caption")}
          inputProps={{
            type: "number",
            placeholder: t("classes:form.totalHours.placeholder"),
            min: 1,
          }}
        />

        {/* Student Selection Field */}
        <div className="space-y-2">
          <label className="font-label font-semibold text-on-surface text-base tracking-wide">
            {t("classes:form.students.label")}
          </label>
          <p className="font-caption text-on-surface-variant text-sm">
            {t("classes:form.students.caption")}
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
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(student.id)}
                    className="p-0.5 rounded-full hover:bg-on-secondary-container/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Student Selector Trigger */}
          <button
            type="button"
            onClick={() => setIsStudentSelectorOpen(true)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                <Users className="w-5 h-5 text-on-secondary-container" />
              </div>
              <div className="text-left">
                <p className="font-medium text-on-surface">
                  {selectedStudents.length > 0
                    ? t("classes:form.students.selectedCount", {
                        count: selectedStudents.length,
                      })
                    : t("classes:form.students.placeholder")}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>
      </FormDrawer>

      {/* Student Selector Drawer */}
      <StudentSelectorDrawer
        isOpen={isStudentSelectorOpen}
        onOpenChange={setIsStudentSelectorOpen}
        selectedIds={selectedStudentIds}
        onChange={handleStudentSelectionChange}
      />
    </>
  );
}
