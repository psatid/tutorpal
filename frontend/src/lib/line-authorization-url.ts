const lineAuthorizationOrigin = "https://access.line.me";

export function validateLineAuthorizationUrl(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Invalid LINE authorization response");
  }

  try {
    const authorizationUrl = new URL(value);

    if (authorizationUrl.origin !== lineAuthorizationOrigin) {
      throw new Error("Invalid LINE authorization response");
    }

    return authorizationUrl.toString();
  } catch {
    throw new Error("Invalid LINE authorization response");
  }
}
