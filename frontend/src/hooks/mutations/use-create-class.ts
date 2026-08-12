import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/lib/api-client";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import type { PostV1ClassesBody } from "@/api/generated/models/postV1ClassesBody";

export const useCreateClass = (options?: { onSuccess?: () => void }) => {
  const { t } = useTranslation("classes");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PostV1ClassesBody) => {
			const response = await apiClient.postV1Classes(data);
      return response.data;
    },
    onSuccess: async () => {
      toast.success(t("toast.createSuccess"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: classesQueryKeys.all }),
			queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all }),
      ]);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toast.createError"));
    },
  });
};
