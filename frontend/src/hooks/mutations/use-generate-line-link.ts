import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

export const useGenerateLineLink = () => {
  return useMutation({
    mutationFn: async (studentId: string) => {
      const response = await apiClient.postV1LineLinkToken({ studentId });
      return response.data;
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to generate LINE link. Please try again.",
      );
    },
  });
};
