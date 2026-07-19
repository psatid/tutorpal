import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
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
    onSuccess: async () => {
      toast.success("Student profile created successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentsQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: studentsQueryKeys.infinites() }),
      ]);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to save student profile. Please try again."
      );
    },
  });
};
