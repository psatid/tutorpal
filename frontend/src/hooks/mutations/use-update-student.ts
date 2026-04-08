import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "@/hooks/queries/query-keys";
import type { StudentFormData } from "@/types/student";

export const useUpdateStudent = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, data }: { studentId: string; data: StudentFormData }) => {
      const response = await apiClient.putV1StudentsById(studentId, {
        name: data.name,
        phoneNumber: data.phone || undefined,
        grade: parseInt(data.grade),
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      showToast.success("Success", "Student profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: studentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentsKeys.detail(variables.studentId) });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showToast.error(
        "Error",
        error.message || "Failed to update student profile. Please try again."
      );
    },
  });
};
