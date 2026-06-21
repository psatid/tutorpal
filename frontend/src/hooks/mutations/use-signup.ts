import { useMutation } from "@tanstack/react-query";
import { authClient, getEmailVerificationCallbackUrl } from "@/lib/auth-client";

export class AuthFlowError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AuthFlowError";
    this.code = code;
  }
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export const useSignup = () => {
  return useMutation({
    mutationFn: async ({ name, email, password }: SignupPayload) => {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: getEmailVerificationCallbackUrl(email),
      });

      if (result.error) {
        throw new AuthFlowError(
          result.error.message || "Signup failed",
          (result.error as { code?: string }).code,
        );
      }

      return result.data;
    },
  });
};
