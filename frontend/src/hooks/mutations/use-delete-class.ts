import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { coursesQueryKeys } from "@/constants/query-keys/courses-query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import { schedulesKeys } from "@/hooks/queries/query-keys";

export const useDeleteClass = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteV1ClassesById(id);
    },
    onSuccess: async (_, id) => {
      toast.success("Class deleted successfully.");
      queryClient.removeQueries({ queryKey: classesQueryKeys.detail(id) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: classesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: coursesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: schedulesKeys.all }),
      ]);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete class. Please try again.");
    },
  });
};
