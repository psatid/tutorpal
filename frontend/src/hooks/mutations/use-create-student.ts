import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "@/hooks/queries/query-keys";
import type { StudentFormData } from "@/types/student";

export const useCreateStudent = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StudentFormData) => {
      const response = await apiClient.postV1Students({
        name: data.name,
        phoneNumber: data.phone || undefined,
        grade: parseInt(data.grade),
      });
      return response.data;
    },
    onSuccess: () => {
      showToast.success("Success", "Student profile created successfully.");
      queryClient.invalidateQueries({ queryKey: studentsKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showToast.error(
        "Error",
        error.message || "Failed to save student profile. Please try again."
      );
    },
  });
};
