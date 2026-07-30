import pino from "pino";

import { ENV } from "./env";

const SENSITIVE_FIELD_NAMES = [
  "authorization",
  "Authorization",
  "cookie",
  "Cookie",
  "cookies",
  "setCookie",
  "password",
  "Password",
  "passwords",
  "secret",
  "Secret",
  "secrets",
  "token",
  "Token",
  "tokens",
  "accessToken",
  "refreshToken",
  "idToken",
  "apiKey",
  "access_token",
  "refresh_token",
  "id_token",
  "client_secret",
  "lineCredentials",
  "lineAccessToken",
  "lineChannelAccessToken",
  "lineChannelSecret",
  "lineCredentialsEncryptionKey",
  "LINE_CREDENTIALS_ENCRYPTION_KEY",
  "channelAccessToken",
  "channelSecret",
  "messagingAccessToken",
  "messagingAccessTokenEncrypted",
  "loginChannelSecret",
  "loginChannelSecretEncrypted",
  "set-cookie",
] as const;

const SENSITIVE_FIELD_NAME_SET = new Set<string>(SENSITIVE_FIELD_NAMES);
const REDACT_PATHS = SENSITIVE_FIELD_NAMES.map((fieldName) =>
  fieldName === "set-cookie" ? `["${fieldName}"]` : fieldName,
);

function sanitizeLogObject(
  logObject: Record<string, unknown>,
): Record<string, unknown> {
  return sanitizeLogValue(logObject, new WeakMap<object, unknown>()) as Record<
    string,
    unknown
  >;
}

function sanitizeLogValue(
  value: unknown,
  seen: WeakMap<object, unknown>,
): unknown {
  if (
    typeof value !== "object" ||
    value === null ||
    value instanceof Date ||
    value instanceof Error
  ) {
    return value;
  }

  const existingSanitizedValue = seen.get(value);
  if (existingSanitizedValue) {
    return existingSanitizedValue;
  }

  const sanitizedValue = (Array.isArray(value) ? [] : {}) as Record<
    string,
    unknown
  >;
  seen.set(value, sanitizedValue);

  for (const [key, nestedValue] of Object.entries(value)) {
    if (!SENSITIVE_FIELD_NAME_SET.has(key)) {
      sanitizedValue[key] = sanitizeLogValue(nestedValue, seen);
    }
  }

  return sanitizedValue;
}

function serializeError(error: Error) {
  return sanitizeLogValue(
    pino.stdSerializers.err(error),
    new WeakMap<object, unknown>(),
  );
}

export function createLogger(component: string) {
  return pino({
    base: {
      service: "tutorpal-backend",
      component,
      environment: ENV.ENVIRONMENT,
    },
    level: ENV.LOG_LEVEL,
    formatters: {
      log: sanitizeLogObject,
    },
    redact: {
      paths: REDACT_PATHS,
      remove: true,
    },
    serializers: {
      err: serializeError,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
