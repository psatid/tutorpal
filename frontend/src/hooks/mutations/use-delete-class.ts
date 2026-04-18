import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { classesKeys } from "@/hooks/queries/query-keys";

export const useDeleteClass = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteV1ClassesById(id);
    },
    onSuccess: () => {
      toast.success("Class deleted successfully.");
      queryClient.invalidateQueries({ queryKey: classesKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete class. Please try again.");
    },
  });
};
