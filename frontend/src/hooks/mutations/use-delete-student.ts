import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
  classesKeys,
  schedulesKeys,
} from "@/hooks/queries/query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";

export const useDeleteStudent = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string) => {
      await apiClient.deleteV1StudentsById(studentId);
    },
    onSuccess: async (_, studentId) => {
      toast.success("Student deleted successfully.");
      queryClient.removeQueries({ queryKey: studentsQueryKeys.detail(studentId) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentsQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: studentsQueryKeys.infinites() }),
        queryClient.invalidateQueries({ queryKey: classesKeys.all }),
        queryClient.invalidateQueries({ queryKey: schedulesKeys.all }),
      ]);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to delete student. Please try again."
      );
    },
  });
};
