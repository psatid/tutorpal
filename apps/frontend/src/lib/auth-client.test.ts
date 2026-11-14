import { describe, expect, it } from "vitest";
import { getEmailVerificationCallbackUrl } from "@/lib/auth-client";

describe("getEmailVerificationCallbackUrl", () => {
  it("does not put an email address or other query data in verification callbacks", () => {
    const callbackUrl = new URL(getEmailVerificationCallbackUrl());

    expect(callbackUrl.pathname).toBe("/verify-email");
    expect(callbackUrl.search).toBe("");
  });
});
