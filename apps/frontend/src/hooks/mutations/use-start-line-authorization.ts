import { useMutation } from "@tanstack/react-query";
import { startLineAuthorization } from "@/lib/social-account-api";

export const useStartLineAuthorization = () =>
  useMutation({
    mutationFn: startLineAuthorization,
  });
