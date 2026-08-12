import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/lib/api-client";
import { schedulesKeys } from "@/hooks/queries/query-keys";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";

export const useDeleteStudent = (options?: { onSuccess?: () => void }) => {
  const { t } = useTranslation("students");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string) => {
      await apiClient.deleteV1StudentsById(studentId);
    },
    onSuccess: async (_, studentId) => {
      toast.success(t("toast.deleteSuccess"));
      queryClient.removeQueries({ queryKey: studentsQueryKeys.detail(studentId) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentsQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: studentsQueryKeys.infinites() }),
        queryClient.invalidateQueries({ queryKey: classesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: schedulesKeys.all }),
      ]);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t("toast.deleteError")
      );
    },
  });
};
