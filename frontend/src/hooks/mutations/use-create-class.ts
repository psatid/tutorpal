import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { coursesQueryKeys } from "@/constants/query-keys/courses-query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import type { PostV1ClassesBody } from "@/api/generated/models/postV1ClassesBody";

export const useCreateClass = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PostV1ClassesBody) => {
			const response = await apiClient.postV1Classes(data);
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Class created successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: classesQueryKeys.all }),
			queryClient.invalidateQueries({ queryKey: coursesQueryKeys.all }),
			queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all }),
      ]);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create class. Please try again.");
    },
  });
};
