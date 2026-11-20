const googleAuthorizationOrigin = "https://accounts.google.com";
const googleAuthorizationPath = "/o/oauth2/v2/auth";

export function validateGoogleAuthorizationUrl(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Invalid Google authorization response");
  }

  try {
    const authorizationUrl = new URL(value);

    if (
      authorizationUrl.origin !== googleAuthorizationOrigin ||
      authorizationUrl.pathname !== googleAuthorizationPath
    ) {
      throw new Error("Invalid Google authorization response");
    }

    return authorizationUrl.toString();
  } catch {
    throw new Error("Invalid Google authorization response");
  }
}
