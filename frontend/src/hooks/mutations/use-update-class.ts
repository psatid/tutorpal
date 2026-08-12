import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/lib/api-client";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import type { ClassFormData } from "@/types/class";

export const useUpdateClass = (options?: { onSuccess?: () => void }) => {
  const { t } = useTranslation("classes");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClassFormData }) => {
      const response = await apiClient.putV1ClassesById(id, {
        name: data.name,
        studentIds: data.studentIds,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast.success(t("toast.updateSuccess"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: classesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all }),
      ]);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toast.updateError"));
    },
  });
};
