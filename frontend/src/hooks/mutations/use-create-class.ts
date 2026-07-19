import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { classesKeys } from "@/hooks/queries/query-keys";
import type { PostV1ClassesBody } from "@/api/generated/models/postV1ClassesBody";

export const useCreateClass = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PostV1ClassesBody) => {
			const response = await apiClient.postV1Classes(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Class created successfully.");
      queryClient.invalidateQueries({ queryKey: classesKeys.all });
			queryClient.invalidateQueries({ queryKey: ["courses"] });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create class. Please try again.");
    },
  });
};
