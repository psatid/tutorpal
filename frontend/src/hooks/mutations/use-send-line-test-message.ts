import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

export const useSendLineTestMessage = () => {
  return useMutation({
    mutationFn: async (studentId: string) => {
      const response = await apiClient.postV1LineTestMessage({ studentId });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Test message sent to student's LINE account.");
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to send test message. Please try again."
      );
    },
  });
};
