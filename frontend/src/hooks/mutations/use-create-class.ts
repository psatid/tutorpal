import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { classesKeys } from "@/hooks/queries/query-keys";
import type { ClassFormData } from "@/types/class";

export const useCreateClass = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClassFormData) => {
      const response = await apiClient.postV1Classes({
        name: data.name,
        totalHours: data.totalHours,
        studentIds: data.studentIds,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Class created successfully.");
      queryClient.invalidateQueries({ queryKey: classesKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create class. Please try again.");
    },
  });
};
