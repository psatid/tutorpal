import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import type { ClassFormData } from "@/types/class";

export const useUpdateClass = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClassFormData }) => {
      const response = await apiClient.putV1ClassesById(id, {
        name: data.name,
        totalHours: data.totalHours,
        studentIds: data.studentIds,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Class updated successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: classesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all }),
      ]);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update class. Please try again.");
    },
  });
};
