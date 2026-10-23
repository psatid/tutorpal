import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/db";
import { AdminUserModel } from "../models/admin-user.model";
import type {
	AdminUserListParams,
	AdminUserListResult,
	IAdminUserRepository,
	UpdateAdminUserDTO,
} from "../types/admin-user.types";

const regularUserWhere = { role: "user" } as const;

export class AdminUserRepository implements IAdminUserRepository {
	constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

	async findAll(params: AdminUserListParams): Promise<AdminUserListResult> {
		const search = params.search?.trim();
		const baseWhere: Prisma.UserWhereInput = {
			...regularUserWhere,
			...(search
				? {
						OR: [
							{ name: { contains: search, mode: "insensitive" } },
							{ email: { contains: search, mode: "insensitive" } },
						],
					}
				: {}),
		};
		const activeWhere: Prisma.UserWhereInput = {
			OR: [{ banned: false }, { banned: null }],
		};
		const statusWhere: Prisma.UserWhereInput | undefined =
			params.status === "active"
				? activeWhere
				: params.status === "deactivated"
					? { banned: true }
					: undefined;
		const where: Prisma.UserWhereInput = statusWhere
			? { AND: [baseWhere, statusWhere] }
			: baseWhere;
		const skip = (params.page - 1) * params.limit;

		const [total, users, active, deactivated] = await Promise.all([
			this.prisma.user.count({ where }),
			this.prisma.user.findMany({
				where,
				skip,
				take: params.limit,
				orderBy: [{ createdAt: "desc" }, { id: "asc" }],
			}),
			this.prisma.user.count({ where: { AND: [baseWhere, activeWhere] } }),
			this.prisma.user.count({ where: { AND: [baseWhere, { banned: true }] } }),
		]);
		const totalPages = Math.ceil(total / params.limit);

		return {
			data: users.map(AdminUserModel.fromPrisma),
			pagination: {
				total,
				page: params.page,
				limit: params.limit,
				totalPages,
				hasNext: params.page < totalPages,
				hasPrev: params.page > 1,
			},
			summaries: { all: active + deactivated, active, deactivated },
		};
	}

	async findById(id: string): Promise<AdminUserModel | null> {
		const user = await this.prisma.user.findFirst({
			where: { id, ...regularUserWhere },
		});
		return user ? AdminUserModel.fromPrisma(user) : null;
	}

	async isEmailInUse(email: string): Promise<boolean> {
		return (
			(await this.prisma.user.count({
				where: { email: { equals: email, mode: "insensitive" } },
			})) > 0
		);
	}

	async update(id: string, data: UpdateAdminUserDTO): Promise<AdminUserModel> {
		const user = await this.prisma.user.update({
			where: { id },
			data: {
				...(data.name !== undefined ? { name: data.name } : {}),
				...(data.email !== undefined
					? { email: data.email, emailVerified: false }
					: {}),
			},
		});
		return AdminUserModel.fromPrisma(user);
	}

	async setPassword(id: string, passwordHash: string): Promise<void> {
		await this.prisma.$transaction(async (tx) => {
			const credential = await tx.account.findFirst({
				where: { userId: id, providerId: "credential" },
				select: { id: true },
			});

			if (credential) {
				await tx.account.update({
					where: { id: credential.id },
					data: { password: passwordHash },
				});
			} else {
				await tx.account.create({
					data: {
						id: crypto.randomUUID(),
						accountId: id,
						providerId: "credential",
						userId: id,
						password: passwordHash,
					},
				});
			}

			await tx.session.deleteMany({ where: { userId: id } });
		});
	}

	async deactivate(id: string): Promise<AdminUserModel> {
		const user = await this.prisma.$transaction(async (tx) => {
			const updated = await tx.user.update({
				where: { id },
				data: {
					banned: true,
					banExpires: null,
					banReason: "Deactivated by administrator",
				},
			});
			await tx.session.deleteMany({ where: { userId: id } });
			return updated;
		});
		return AdminUserModel.fromPrisma(user);
	}

	async reactivate(id: string): Promise<AdminUserModel> {
		const user = await this.prisma.user.update({
			where: { id },
			data: { banned: false, banExpires: null, banReason: null },
		});
		return AdminUserModel.fromPrisma(user);
	}

	async revokeSessions(id: string): Promise<void> {
		await this.prisma.session.deleteMany({ where: { userId: id } });
	}
}

export const adminUserRepository = new AdminUserRepository();
