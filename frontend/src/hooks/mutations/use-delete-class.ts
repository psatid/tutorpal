import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api-client";
import { classesKeys } from "@/hooks/queries/query-keys";

export const useDeleteClass = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteV1ClassesById(id);
    },
    onSuccess: () => {
      showToast.success("Success", "Class deleted successfully.");
      queryClient.invalidateQueries({ queryKey: classesKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showToast.error(
        "Error",
        error.message || "Failed to delete class. Please try again."
      );
    },
  });
};
