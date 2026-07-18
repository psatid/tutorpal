import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ENV } from "./env";
import { AppError } from "./error";

const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function encryptionKey(): Buffer {
	const key = Buffer.from(ENV.LINE_CREDENTIALS_ENCRYPTION_KEY, "base64");
	if (key.length !== 32) {
		throw AppError.badRequest(
			"LINE_ENCRYPTION_NOT_CONFIGURED",
			"LINE credential encryption is not configured. Contact support.",
		);
	}
	return key;
}

export function encryptLineCredential(value: string): string {
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
	const encrypted = Buffer.concat([
		cipher.update(value, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptLineCredential(value: string): string {
	const payload = Buffer.from(value, "base64");
	if (payload.length <= IV_BYTES + AUTH_TAG_BYTES) {
		throw AppError.badRequest(
			"LINE_CREDENTIALS_INVALID",
			"Saved LINE credentials are invalid.",
		);
	}
	const iv = payload.subarray(0, IV_BYTES);
	const tag = payload.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
	const encrypted = payload.subarray(IV_BYTES + AUTH_TAG_BYTES);
	const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
		"utf8",
	);
}
