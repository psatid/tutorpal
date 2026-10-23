import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { ENV } from "@/lib/env";
import { clearImpersonationRecovery } from "@/lib/impersonation-recovery";

export type StopImpersonationErrorCategory =
  | "retryable"
  | "original-session-unavailable";

export class StopImpersonationError extends Error {
  constructor(readonly category: StopImpersonationErrorCategory) {
    super("Unable to exit tutor view.");
    this.name = "StopImpersonationError";
  }
}

type StopImpersonationErrorDetails = {
  status?: unknown;
  statusCode?: unknown;
  code?: unknown;
  errorCode?: unknown;
};

const ORIGINAL_SESSION_UNAVAILABLE_CODE =
  "IMPERSONATION_ADMIN_SESSION_UNAVAILABLE";

function getStopImpersonationErrorCategory(
  error: unknown,
): StopImpersonationErrorCategory {
  if (typeof error !== "object" || error === null) return "retryable";

  const { status, statusCode, code, errorCode } =
    error as StopImpersonationErrorDetails;
  const httpStatus =
    typeof status === "number"
      ? status
      : typeof statusCode === "number"
        ? statusCode
        : undefined;
  const errorCodes = [code, errorCode].filter(
    (value): value is string => typeof value === "string",
  );

  if (
    httpStatus === 401 ||
    errorCodes.includes("UNAUTHORIZED") ||
    errorCodes.includes(ORIGINAL_SESSION_UNAVAILABLE_CODE)
  ) {
    return "original-session-unavailable";
  }

  return "retryable";
}

export function useStopImpersonation() {
  const queryClient = useQueryClient();

  return useMutation<void, StopImpersonationError>({
    mutationFn: async () => {
      try {
        const result = await authClient.admin.stopImpersonating();

        if (result.error) {
          throw new StopImpersonationError(
            getStopImpersonationErrorCategory(result.error),
          );
        }
      } catch (error) {
        if (error instanceof StopImpersonationError) throw error;

        throw new StopImpersonationError(
          getStopImpersonationErrorCategory(error),
        );
      }
    },
    onSuccess: () => {
      queryClient.clear();
      clearImpersonationRecovery();
      window.location.assign(ENV.ADMIN_APP_URL);
    },
  });
}
