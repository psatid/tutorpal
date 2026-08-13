import type { AdminUserModel } from "../models/admin-user.model";
import type { PaginatedResponse } from "./pagination.types";

export type AdminUserStatus = "active" | "deactivated";
export type AdminUserListStatus = AdminUserStatus | "all";

export type AdminUserDTO = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	status: AdminUserStatus;
	createdAt: string;
	updatedAt: string;
};

export type AdminUserListParams = {
	page: number;
	limit: number;
	search?: string;
	status: AdminUserListStatus;
};

export type AdminUserSummary = {
	all: number;
	active: number;
	deactivated: number;
};

export type AdminUserListResult = PaginatedResponse<AdminUserModel> & {
	summaries: AdminUserSummary;
};

export type CreateAdminUserDTO = {
	name: string;
	email: string;
	password: string;
};

export type UpdateAdminUserDTO = {
	name?: string;
	email?: string;
};

export type UpdateAdminUserResult = {
	user: AdminUserModel;
	verificationSent: boolean | null;
};

export interface IAdminUserRepository {
	findAll(params: AdminUserListParams): Promise<AdminUserListResult>;
	findById(id: string): Promise<AdminUserModel | null>;
	isEmailInUse(email: string): Promise<boolean>;
	update(id: string, data: UpdateAdminUserDTO): Promise<AdminUserModel>;
	setPassword(id: string, passwordHash: string): Promise<void>;
	deactivate(id: string): Promise<AdminUserModel>;
	reactivate(id: string): Promise<AdminUserModel>;
	revokeSessions(id: string): Promise<void>;
}
