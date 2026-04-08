import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserPlus, Pencil, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RHFInputField, RHFSelectField } from "@/components/ui/form/rhf";
import {
  Drawer,
  DrawerPortal,
  DrawerBackdrop,
  DrawerViewport,
  DrawerPopup,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import { useCreateStudent } from "@/hooks/mutations/use-create-student";
import { useUpdateStudent } from "@/hooks/mutations/use-update-student";
import { useGetStudent } from "@/hooks/queries/use-get-student";
import { studentSchema, type StudentFormData } from "@/types/student";

export type DrawerMode = "create" | "view" | "edit";

interface StudentDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  studentId: string | null;
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
  studentId,
  onModeChange,
}: StudentDrawerProps) {
  const { handleSubmit, reset, control, setValue } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      phone: "",
      grade: undefined,
    },
  });

  const { data: studentData, isLoading: isLoadingStudent } =
    useGetStudent(studentId);

  useEffect(() => {
    if (studentData && (mode === "view" || mode === "edit")) {
      setValue("name", studentData.name);
      setValue("phone", studentData.phoneNumber || "");
      setValue("grade", String(studentData.grade) as StudentFormData["grade"]);
    }
  }, [studentData, mode, setValue]);

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
    } else if (mode === "edit" && studentId) {
      updateMutation.mutate({ studentId, data });
    }
  };

  const isDisabled = mode === "view" || isLoadingStudent;

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Add New Student";
      case "view":
        return "Student Details";
      case "edit":
        return "Edit Student";
      default:
        return "";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "create":
        return "Create Student Profile";
      case "edit":
        return "Update Student Profile";
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
              <div className="w-12 h-1.5 bg-surface-variant rounded-full mx-auto my-4" />

              <div className="px-8 pb-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    {mode === "view" && (
                      <Eye className="w-6 h-6 text-primary" />
                    )}
                    {mode === "edit" && (
                      <Pencil className="w-6 h-6 text-primary" />
                    )}
                    <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
                      {getTitle()}
                    </h2>
                  </div>
                  <DrawerClose>
                    <X className="w-6 h-6" />
                  </DrawerClose>
                </div>

                {isLoadingStudent ? (
                  <div className="text-center py-8 text-on-surface-variant">
                    Loading student details...
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <RHFInputField
                      control={control}
                      name="name"
                      label="Full Name"
                      caption={mode === "create" ? "Required" : undefined}
                      disabled={isDisabled}
                      inputProps={{
                        type: "text",
                        placeholder: "e.g. Leo Henderson",
                      }}
                    />

                    <RHFInputField
                      control={control}
                      name="phone"
                      label="Phone Number"
                      caption={mode === "create" ? "Optional" : undefined}
                      disabled={isDisabled}
                      inputProps={{
                        type: "tel",
                        placeholder: "081-234-5678",
                      }}
                    />

                    <RHFSelectField
                      control={control}
                      name="grade"
                      label="Grade Level"
                      caption={mode === "create" ? "Required" : undefined}
                      options={gradeOptions}
                      disabled={isDisabled}
                      selectProps={{
                        placeholder: "Select Grade",
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
                          Edit Student
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className="w-full"
                          loading={
                            createMutation.isPending || updateMutation.isPending
                          }
                          leftIcon={mode === "create" ? UserPlus : Save}
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
                        {mode === "view" ? "Close" : "Cancel"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </DrawerContent>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  );
}
