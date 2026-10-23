import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/lib/api-client";

export const useSendLineTestMessage = () => {
  const { t } = useTranslation("students");
  return useMutation({
    mutationFn: async (studentId: string) => {
      const response = await apiClient.postV1LineTestMessage({ studentId });
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("toast.lineTestSuccess"));
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t("toast.lineTestError")
      );
    },
  });
};
