import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/lib/api-client";
import { schedulesKeys } from "@/hooks/queries/query-keys";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import type { StudentFormData } from "@/types/student";

export const useUpdateStudent = (options?: { onSuccess?: () => void }) => {
  const { t } = useTranslation("students");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      data,
    }: {
      studentId: string;
      data: StudentFormData;
    }) => {
      const response = await apiClient.putV1StudentsById(studentId, {
        name: data.name,
        phoneNumber: data.phone || undefined,
        grade: parseInt(data.grade),
      });
      return response.data;
    },
    onSuccess: async (_, variables) => {
      toast.success(t("toast.updateSuccess"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentsQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: studentsQueryKeys.infinites() }),
        queryClient.invalidateQueries({
          queryKey: studentsQueryKeys.detail(variables.studentId),
        }),
        queryClient.invalidateQueries({ queryKey: classesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: schedulesKeys.all }),
      ]);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t("toast.updateError")
      );
    },
  });
};
