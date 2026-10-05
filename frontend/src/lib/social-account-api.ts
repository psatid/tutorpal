import { isAxiosError } from "axios";
import type { PostV1AuthSocialAccountsLineAuthorization200 } from "@/api/generated/models/postV1AuthSocialAccountsLineAuthorization200";
import { authClient } from "@/lib/auth-client";
import { apiClient } from "@/lib/api-client";
import { validateLineAuthorizationUrl } from "@/lib/line-authorization-url";

export type SocialAccountStatus = {
  password: boolean;
  google: boolean;
  line: boolean;
};

function isLineAuthorizationResponse(
  value: unknown,
): value is PostV1AuthSocialAccountsLineAuthorization200 {
  return (
    typeof value === "object" &&
    value !== null &&
    "authorizationUrl" in value &&
    typeof value.authorizationUrl === "string"
  );
}

export async function getSocialAccountStatus(): Promise<SocialAccountStatus> {
  const result = await authClient.listAccounts();

  if (result.error || !Array.isArray(result.data)) {
    throw new Error("Unable to list linked accounts");
  }

  const providers = new Set(result.data.map((account) => account.providerId));

  return {
    password: providers.has("credential"),
    google: providers.has("google"),
    line: providers.has("line"),
  };
}

export async function startLineAuthorization(): Promise<string> {
  let payload: unknown;

  try {
    const response =
      await apiClient.postV1AuthSocialAccountsLineAuthorization();
    payload = response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error("Unable to start LINE authorization");
    }

    throw error;
  }

  if (!isLineAuthorizationResponse(payload)) {
    throw new Error("Invalid LINE authorization response");
  }

  return validateLineAuthorizationUrl(payload.authorizationUrl);
}
