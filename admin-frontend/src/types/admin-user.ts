import type { TFunction } from "i18next";
import { z } from "zod";

export function createAdminUserSchema(t: TFunction) {
	return z.object({
		name: z.string().trim().min(1, t("form.required")),
		email: z.string().trim().pipe(z.email(t("form.invalidEmail"))),
		password: z.string().min(8, t("form.passwordTooShort")),
	});
}

export function createAdminUserEditSchema(t: TFunction) {
	return z.object({
		name: z.string().trim().min(1, t("form.required")),
		email: z.string().trim().pipe(z.email(t("form.invalidEmail"))),
	});
}

export function createAdminUserPasswordSchema(t: TFunction) {
	return z
		.object({
			newPassword: z.string().min(8, t("form.passwordTooShort")),
			confirmPassword: z.string().min(1, t("form.required")),
		})
		.refine((data) => data.newPassword === data.confirmPassword, {
			message: t("form.passwordsDoNotMatch"),
			path: ["confirmPassword"],
		});
}

export type AdminUserCreateFormData = z.output<
	ReturnType<typeof createAdminUserSchema>
>;

export type AdminUserEditFormData = z.output<
	ReturnType<typeof createAdminUserEditSchema>
>;

export type AdminUserPasswordFormData = z.output<
	ReturnType<typeof createAdminUserPasswordSchema>
>;

export type AdminUserStatus = "active" | "deactivated";
export type AdminUserListStatus = AdminUserStatus | "all";

export const adminUserSearchSchema = z.object({
	search: z.string().catch("").default(""),
	status: z.enum(["all", "active", "deactivated"]).catch("all").default("all"),
	page: z.coerce.number().int().positive().catch(1).default(1),
});

export type AdminUser = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	status: AdminUserStatus;
	createdAt: string;
	updatedAt: string;
};

export type AdminUserListParams = {
	search: string;
	status: AdminUserListStatus;
	page: number;
	limit: number;
};

export type AdminUserListResponse = {
	data: AdminUser[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
	summaries: Record<AdminUserListStatus, number>;
};

export type CreateAdminUserResponse = {
	user: AdminUser;
	verificationSent: boolean;
};

export type UpdateAdminUserResponse = {
	user: AdminUser;
	verificationSent: boolean | null;
};
