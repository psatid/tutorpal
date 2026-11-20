import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.hoisted(() => ({
  postV1AuthSocialAccountsGoogleAuthorization: vi.fn(),
  postV1AuthSocialAccountsLineAuthorization: vi.fn(),
}));
const authClient = vi.hoisted(() => ({ listAccounts: vi.fn() }));

vi.mock("@/lib/api-client", () => ({ apiClient }));
vi.mock("@/lib/auth-client", () => ({ authClient }));

import {
  getSocialAccountStatus,
  startGoogleAuthorization,
  startLineAuthorization,
} from "@/lib/social-account-api";

describe("social account API", () => {
  beforeEach(() => {
    apiClient.postV1AuthSocialAccountsGoogleAuthorization.mockReset();
    apiClient.postV1AuthSocialAccountsLineAuthorization.mockReset();
    authClient.listAccounts.mockReset();
  });

  it("starts Google enrollment through the custom authenticated endpoint and returns only its exact authorization URL", async () => {
    const authorizationUrl =
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=tutorpal&state=signed-state";
    apiClient.postV1AuthSocialAccountsGoogleAuthorization.mockResolvedValue({
      data: { authorizationUrl },
    });

    await expect(startGoogleAuthorization()).resolves.toBe(authorizationUrl);

    expect(
      apiClient.postV1AuthSocialAccountsGoogleAuthorization,
    ).toHaveBeenCalledOnce();
  });

  it.each([
    "http://accounts.google.com/o/oauth2/v2/auth",
    "https://accounts.google.com/o/oauth2/auth",
    "https://accounts.google.com.evil.example/o/oauth2/v2/auth",
    "https://evil.example/o/oauth2/v2/auth",
  ])("rejects an unsafe Google authorization URL: %s", async (authorizationUrl) => {
    apiClient.postV1AuthSocialAccountsGoogleAuthorization.mockResolvedValue({
      data: { authorizationUrl },
    });

    await expect(startGoogleAuthorization()).rejects.toThrow(
      "Invalid Google authorization response",
    );
  });

  it("rejects malformed Google responses and normalizes HTTP failures", async () => {
    apiClient.postV1AuthSocialAccountsGoogleAuthorization.mockResolvedValue({
      data: { authorizationUrl: 42 },
    });

    await expect(startGoogleAuthorization()).rejects.toThrow(
      "Invalid Google authorization response",
    );

    apiClient.postV1AuthSocialAccountsGoogleAuthorization.mockRejectedValue(
      { isAxiosError: true, response: { status: 403 } },
    );

    await expect(startGoogleAuthorization()).rejects.toThrow(
      "Unable to start Google authorization",
    );
  });

  it("keeps the existing LINE authorization boundary intact", async () => {
    const authorizationUrl = "https://access.line.me/oauth2/v2.1/authorize?state=line";
    apiClient.postV1AuthSocialAccountsLineAuthorization.mockResolvedValue({
      data: { authorizationUrl },
    });

    await expect(startLineAuthorization()).resolves.toBe(authorizationUrl);
    expect(apiClient.postV1AuthSocialAccountsLineAuthorization).toHaveBeenCalledOnce();
  });

  it("derives account status from the auth client without treating an invalid response as linked", async () => {
    authClient.listAccounts.mockResolvedValue({
      data: [{ providerId: "credential" }, { providerId: "google" }],
    });

    await expect(getSocialAccountStatus()).resolves.toEqual({
      password: true,
      google: true,
      line: false,
    });

    authClient.listAccounts.mockResolvedValue({ error: { message: "expired" } });
    await expect(getSocialAccountStatus()).rejects.toThrow("Unable to list linked accounts");
  });
});
