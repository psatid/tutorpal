import { ENV } from "@/lib/env";
import type {
	AdminUser,
	AdminUserCreateFormData,
	AdminUserEditFormData,
	AdminUserListParams,
	AdminUserListResponse,
	CreateAdminUserResponse,
	UpdateAdminUserResponse,
} from "@/types/admin-user";

type ApiErrorResponse = {
	errorCode?: string;
	message?: string;
};

export class AdminUserApiError extends Error {
	constructor(
		public readonly errorCode: string | undefined,
		message: string,
	) {
		super(message);
		this.name = "AdminUserApiError";
	}
}

async function request<T>(
	path: string,
	options: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<T> {
	const { body, headers, ...init } = options;
	const response = await fetch(new URL(path, ENV.API_URL), {
		...init,
		credentials: "include",
		headers: {
			Accept: "application/json",
			...(body === undefined ? {} : { "Content-Type": "application/json" }),
			...headers,
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});

	const payload = (await response.json().catch(() => null)) as
		| T
		| ApiErrorResponse
		| null;

	if (!response.ok) {
		const error = payload as ApiErrorResponse | null;
		throw new AdminUserApiError(
			error?.errorCode,
			error?.message ?? "Unable to complete the request.",
		);
	}

	return payload as T;
}

export function getAdminUsers(params: AdminUserListParams) {
	const search = new URLSearchParams({
		search: params.search,
		status: params.status,
		page: String(params.page),
		limit: String(params.limit),
	});

	return request<AdminUserListResponse>(`/v1/admin/users?${search}`);
}

export function createAdminUser(input: AdminUserCreateFormData) {
	return request<CreateAdminUserResponse>("/v1/admin/users", {
		method: "POST",
		body: input,
	});
}

export function updateAdminUser(
	id: string,
	input: AdminUserEditFormData,
) {
	return request<UpdateAdminUserResponse>(`/v1/admin/users/${id}`, {
		method: "PATCH",
		body: input,
	});
}

export function setAdminUserPassword(id: string, newPassword: string) {
	return request<{ success: true; sessionsRevoked: true }>(
		`/v1/admin/users/${id}/password`,
		{ method: "POST", body: { newPassword } },
	);
}

export function deactivateAdminUser(id: string) {
	return request<{ user: AdminUser }>(`/v1/admin/users/${id}/deactivate`, {
		method: "POST",
	});
}

export function reactivateAdminUser(id: string) {
	return request<{ user: AdminUser }>(`/v1/admin/users/${id}/reactivate`, {
		method: "POST",
	});
}

export function resendAdminUserVerification(id: string) {
	return request<{ verificationSent: true }>(`/v1/admin/users/${id}/verification`, {
		method: "POST",
	});
}
