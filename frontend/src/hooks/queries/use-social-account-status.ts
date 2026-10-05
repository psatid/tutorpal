import { useQuery } from "@tanstack/react-query";
import { socialAccountQueryKeys } from "@/constants/query-keys/social-account-query-keys";
import { getSocialAccountStatus } from "@/lib/social-account-api";

export const useSocialAccountStatus = () =>
  useQuery({
    queryKey: socialAccountQueryKeys.status(),
    queryFn: getSocialAccountStatus,
  });
