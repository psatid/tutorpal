import { useMutation } from "@tanstack/react-query";
import { startGoogleAuthorization } from "@/lib/social-account-api";

export const useStartGoogleAuthorization = () =>
  useMutation({
    mutationFn: startGoogleAuthorization,
  });
