import { ENV } from "@/lib/env";

const IMPERSONATION_RECOVERY_MARKER_KEY =
  "tutorpal-impersonation-recovery";
const IMPERSONATION_RECOVERY_MARKER_DURATION_MS = 60 * 60 * 1000;

function getSessionStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function markImpersonationRecovery() {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(
      IMPERSONATION_RECOVERY_MARKER_KEY,
      String(Date.now() + IMPERSONATION_RECOVERY_MARKER_DURATION_MS),
    );
  } catch {
    // Recovery remains optional when browser storage is unavailable.
  }
}

export function hasImpersonationRecoveryMarker() {
  const storage = getSessionStorage();
  if (!storage) return false;

  try {
    const expiresAt = Number(
      storage.getItem(IMPERSONATION_RECOVERY_MARKER_KEY),
    );

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      storage.removeItem(IMPERSONATION_RECOVERY_MARKER_KEY);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function clearImpersonationRecovery() {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.removeItem(IMPERSONATION_RECOVERY_MARKER_KEY);
  } catch {
    // The session has already been restored even if storage cannot be cleared.
  }
}

export function getAdminImpersonationRecoveryUrl() {
  const url = new URL("/login", ENV.ADMIN_APP_URL);
  url.searchParams.set("recovery", "impersonation");

  return url.toString();
}
