import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { AppError } from "./error";
import { getLocalAppConfig } from "./local-config";

const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

export type LineCredentialCipher = {
	encrypt(value: string): string;
	decrypt(value: string): string;
};

function encryptionKey(encryptionKeyValue: string): Buffer {
	const key = Buffer.from(encryptionKeyValue, "base64");
	if (key.length !== 32) {
		throw AppError.badRequest(
			"LINE_ENCRYPTION_NOT_CONFIGURED",
			"LINE credential encryption is not configured. Contact support.",
		);
	}
	return key;
}

export function createLineCredentialCipher(
	encryptionKeyValue: string,
): LineCredentialCipher {
	return {
		encrypt(value) {
			const iv = randomBytes(IV_BYTES);
			const cipher = createCipheriv(
				"aes-256-gcm",
				encryptionKey(encryptionKeyValue),
				iv,
			);
			const encrypted = Buffer.concat([
				cipher.update(value, "utf8"),
				cipher.final(),
			]);
			const tag = cipher.getAuthTag();
			return Buffer.concat([iv, tag, encrypted]).toString("base64");
		},
		decrypt(value) {
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
			const decipher = createDecipheriv(
				"aes-256-gcm",
				encryptionKey(encryptionKeyValue),
				iv,
			);
			decipher.setAuthTag(tag);
			return Buffer.concat([
				decipher.update(encrypted),
				decipher.final(),
			]).toString("utf8");
		},
	};
}

function getLocalLineCredentialCipher() {
	return createLineCredentialCipher(
		getLocalAppConfig().LINE_CREDENTIALS_ENCRYPTION_KEY,
	);
}

export function encryptLineCredential(value: string): string {
	return getLocalLineCredentialCipher().encrypt(value);
}

export function decryptLineCredential(value: string): string {
	return getLocalLineCredentialCipher().decrypt(value);
}
