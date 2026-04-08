import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "@/hooks/queries/query-keys";

export const useDeleteStudent = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string) => {
      await apiClient.deleteV1StudentsById(studentId);
    },
    onSuccess: () => {
      showToast.success("Success", "Student deleted successfully.");
      queryClient.invalidateQueries({ queryKey: studentsKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showToast.error(
        "Error",
        error.message || "Failed to delete student. Please try again."
      );
    },
  });
};
