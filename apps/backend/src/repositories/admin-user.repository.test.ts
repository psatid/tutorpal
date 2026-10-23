import { describe, expect, test } from "bun:test";
import type { Prisma, PrismaClient } from "@prisma/client";
import { AdminUserRepository } from "./admin-user.repository";

describe("AdminUserRepository", () => {
	test("uses the exact regular-user scope for target lookups and case-insensitive duplicates", async () => {
		let findFirstArgs: Prisma.UserFindFirstArgs | undefined;
		let countArgs: Prisma.UserCountArgs | undefined;
		const prisma = {
			user: {
				findFirst: async (args: Prisma.UserFindFirstArgs) => {
					findFirstArgs = args;
					return null;
				},
				count: async (args: Prisma.UserCountArgs) => {
					countArgs = args;
					return 1;
				},
			},
		} as unknown as PrismaClient;
		const repository = new AdminUserRepository(prisma);

		expect(await repository.findById("admin-1")).toBeNull();
		expect(await repository.isEmailInUse("Ada@Example.com")).toBe(true);
		expect(findFirstArgs).toEqual({ where: { id: "admin-1", role: "user" } });
		expect(countArgs).toEqual({
			where: {
				email: { equals: "Ada@Example.com", mode: "insensitive" },
			},
		});
	});

	test("lists only regular users with stable ordering, search, status, and summaries", async () => {
		const countWheres: Prisma.UserWhereInput[] = [];
		let findManyArgs: Prisma.UserFindManyArgs | undefined;
		const prisma = {
			user: {
				count: async ({ where }: Prisma.UserCountArgs) => {
					countWheres.push(where ?? {});
					const serialized = JSON.stringify(where);
					if (serialized.includes('"banned":true')) return 1;
					if (serialized.includes('"banned":false')) return 2;
					return 2;
				},
				findMany: async (args: Prisma.UserFindManyArgs) => {
					findManyArgs = args;
					return [
						{
							id: "user-2",
							name: "Ada Lovelace",
							email: "ada@example.com",
							emailVerified: false,
							image: null,
							createdAt: new Date("2026-08-12T00:00:00.000Z"),
							updatedAt: new Date("2026-08-12T00:00:00.000Z"),
							role: "user",
							banned: false,
							banReason: null,
							banExpires: null,
						},
					];
				},
			},
		} as unknown as PrismaClient;
		const repository = new AdminUserRepository(prisma);

		const result = await repository.findAll({
			page: 2,
			limit: 10,
			search: "Ada",
			status: "active",
		});

		expect(findManyArgs).toMatchObject({
			skip: 10,
			take: 10,
			orderBy: [{ createdAt: "desc" }, { id: "asc" }],
			where: {
				AND: [
					{
						role: "user",
						OR: [
							{ name: { contains: "Ada", mode: "insensitive" } },
							{ email: { contains: "Ada", mode: "insensitive" } },
						],
					},
					{ OR: [{ banned: false }, { banned: null }] },
				],
			},
		});
		expect(countWheres).toHaveLength(3);
		expect(result.pagination).toEqual({
			total: 2,
			page: 2,
			limit: 10,
			totalPages: 1,
			hasNext: false,
			hasPrev: true,
		});
		expect(result.summaries).toEqual({
			all: 3,
			active: 2,
			deactivated: 1,
		});
	});

	test("deactivates and resets sessions transactionally, then reactivates without restoring sessions", async () => {
		const userUpdates: Prisma.UserUpdateArgs[] = [];
		const deletedSessionWheres: Prisma.SessionDeleteManyArgs[] = [];
		const prisma = {
			user: {
				update: async (args: Prisma.UserUpdateArgs) => {
					userUpdates.push(args);
					return {
						id: "user-1",
						name: "Ada Lovelace",
						email: "ada@example.com",
						emailVerified: true,
						image: null,
						createdAt: new Date("2026-08-12T00:00:00.000Z"),
						updatedAt: new Date("2026-08-12T01:00:00.000Z"),
						role: "user",
						banned: args.data.banned === true,
						banReason: null,
						banExpires: null,
					};
				},
			},
			session: {
				deleteMany: async (args: Prisma.SessionDeleteManyArgs) => {
					deletedSessionWheres.push(args);
					return { count: 1 };
				},
			},
			$transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
				callback({
					user: {
						update: async (args: Prisma.UserUpdateArgs) => {
							userUpdates.push(args);
							return {
								id: "user-1",
								name: "Ada Lovelace",
								email: "ada@example.com",
								emailVerified: true,
								image: null,
								createdAt: new Date("2026-08-12T00:00:00.000Z"),
								updatedAt: new Date("2026-08-12T01:00:00.000Z"),
								role: "user",
								banned: true,
								banReason: "Deactivated by administrator",
								banExpires: null,
							};
						},
					},
					session: {
						deleteMany: async (args: Prisma.SessionDeleteManyArgs) => {
							deletedSessionWheres.push(args);
							return { count: 1 };
						},
					},
				}),
		} as unknown as PrismaClient;
		const repository = new AdminUserRepository(prisma);

		expect(
			(await repository.deactivate("user-1")).toAdminUserDTO().status,
		).toBe("deactivated");
		expect(
			(await repository.reactivate("user-1")).toAdminUserDTO().status,
		).toBe("active");
		expect(userUpdates).toEqual([
			{
				where: { id: "user-1" },
				data: {
					banned: true,
					banExpires: null,
					banReason: "Deactivated by administrator",
				},
			},
			{
				where: { id: "user-1" },
				data: { banned: false, banExpires: null, banReason: null },
			},
		]);
		expect(deletedSessionWheres).toEqual([{ where: { userId: "user-1" } }]);
	});
});
