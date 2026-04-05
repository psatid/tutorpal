import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RHFInputField, RHFSelectField } from "@/components/form/rhf";
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
import { studentSchema, type StudentFormData } from "@/types/student";

interface AddStudentDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AddStudentDrawer({
  isOpen,
  onOpenChange,
}: AddStudentDrawerProps) {
  const {
    handleSubmit,
    reset,
    control,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      phone: "",
      grade: undefined,
    },
  });

  const mutation = useCreateStudent({
    onSuccess: () => {
      reset();
      onOpenChange(false);
    },
  });

  const onSubmit = (data: StudentFormData) => {
    mutation.mutate(data);
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
                    Add New Student
                  </h2>
                  <DrawerClose>
                    <X className="w-6 h-6" />
                  </DrawerClose>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <RHFInputField
                    control={control}
                    name="name"
                    label="Full Name"
                    caption="Required"
                    inputProps={{
                      type: "text",
                      placeholder: "e.g. Leo Henderson",
                    }}
                  />

                  <RHFInputField
                    control={control}
                    name="phone"
                    label="Phone Number"
                    caption="Optional"
                    inputProps={{
                      type: "tel",
                      placeholder: "081-234-5678",
                    }}
                  />

                  <RHFSelectField
                    control={control}
                    name="grade"
                    label="Grade Level"
                    caption="Required"
                    options={gradeOptions}
                    selectProps={{
                      placeholder: "Select Grade",
                    }}
                  />

                  <div className="pt-4 space-y-3">
                    <Button
                      type="submit"
                      className="w-full"
                      loading={mutation.isPending}
                      leftIcon={UserPlus}
                    >
                      Create Student Profile
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
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
