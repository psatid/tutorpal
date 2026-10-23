import { Prisma } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import type { Auth } from "../lib/auth-factory";
import { AppError } from "../lib/error";
import type { AdminUserModel } from "../models/admin-user.model";
import type {
	AdminUserListParams,
	AdminUserListResult,
	CreateAdminUserDTO,
	IAdminUserRepository,
	UpdateAdminUserDTO,
	UpdateAdminUserResult,
} from "../types/admin-user.types";

type AdminUserServiceOptions = {
	emailVerificationCallbackUrl: string;
};

function isUniqueConstraintError(error: unknown): boolean {
	return (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === "P2002"
	);
}

function userEmailExistsError(): AppError {
	return AppError.conflict("USER_EMAIL_EXISTS", "Email is already in use");
}

export class AdminUserService {
	constructor(
		private readonly repository: IAdminUserRepository,
		private readonly auth: Auth,
		private readonly options: AdminUserServiceOptions,
	) {}

	getAllUsers(params: AdminUserListParams): Promise<AdminUserListResult> {
		return this.repository.findAll(params);
	}

	async getUserById(id: string): Promise<AdminUserModel> {
		return this.requireRegularUser(id);
	}

	async createUser(
		data: CreateAdminUserDTO,
	): Promise<{ user: AdminUserModel; verificationSent: boolean }> {
		const email = data.email.trim().toLowerCase();
		if (await this.repository.isEmailInUse(email)) {
			throw userEmailExistsError();
		}

		let created: Awaited<ReturnType<Auth["api"]["createUser"]>>;
		try {
			created = await this.auth.api.createUser({
				body: { email, name: data.name, password: data.password, role: "user" },
			});
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				throw userEmailExistsError();
			}
			throw error;
		}
		const user = await this.requireRegularUser(created.user.id);
		const verificationSent = await this.sendVerificationEmail(email);

		return { user, verificationSent };
	}

	async updateUser(
		id: string,
		data: UpdateAdminUserDTO,
	): Promise<UpdateAdminUserResult> {
		const existing = await this.requireRegularUser(id);
		const email = data.email?.trim().toLowerCase();
		if (email !== undefined && email !== existing.email) {
			if (await this.repository.isEmailInUse(email)) {
				throw AppError.conflict("USER_EMAIL_EXISTS", "Email is already in use");
			}
		}

		const emailChanged = email !== undefined && email !== existing.email;
		let user: AdminUserModel;
		try {
			user = await this.repository.update(id, {
				...(data.name !== undefined ? { name: data.name } : {}),
				...(emailChanged ? { email } : {}),
			});
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				throw userEmailExistsError();
			}
			throw error;
		}
		if (!emailChanged) {
			return { user, verificationSent: null };
		}

		await this.repository.revokeSessions(id);
		return {
			user,
			verificationSent: await this.sendVerificationEmail(email),
		};
	}

	async setPassword(id: string, password: string): Promise<void> {
		await this.requireRegularUser(id);
		await this.repository.setPassword(id, await hashPassword(password));
	}

	async deactivateUser(id: string): Promise<AdminUserModel> {
		await this.requireRegularUser(id);
		return this.repository.deactivate(id);
	}

	async reactivateUser(id: string): Promise<AdminUserModel> {
		await this.requireRegularUser(id);
		return this.repository.reactivate(id);
	}

	async resendVerificationEmail(id: string): Promise<boolean> {
		const user = await this.requireRegularUser(id);
		if (user.emailVerified) {
			throw AppError.badRequest(
				"EMAIL_ALREADY_VERIFIED",
				"Email is already verified",
			);
		}
		const verificationSent = await this.sendVerificationEmail(user.email);
		if (!verificationSent) {
			throw AppError.badGateway(
				"VERIFICATION_EMAIL_FAILED",
				"Verification email could not be sent",
			);
		}
		return true;
	}

	private async requireRegularUser(id: string): Promise<AdminUserModel> {
		const user = await this.repository.findById(id);
		if (!user) {
			throw AppError.notFound("USER_NOT_FOUND", "User not found");
		}
		return user;
	}

	private async sendVerificationEmail(email: string): Promise<boolean> {
		try {
			await this.auth.api.sendVerificationEmail({
				body: {
					email,
					callbackURL: this.options.emailVerificationCallbackUrl,
				},
			});
			return true;
		} catch {
			return false;
		}
	}
}
