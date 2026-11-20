import { describe, expect, test } from "bun:test";
import {
	getGoogleEnrollmentIdentifier,
	SocialAccountRepository,
} from "./social-account.repository";

describe("SocialAccountRepository.consumeLineEnrollmentState", () => {
	test("atomically deletes only an unexpired LINE enrollment state", async () => {
		let findArgs: unknown;
		let deleteArgs: unknown;
		const transaction = {
			verification: {
				findUnique: async (args: unknown) => {
					findArgs = args;
					return {
						identifier: "social-account:line:enrollment:user-1",
						value: "stored-state",
					};
				},
				deleteMany: async (args: unknown) => {
					deleteArgs = args;
					return { count: 1 };
				},
			},
		};
		const repository = new SocialAccountRepository({
			$transaction: async (
				callback: (tx: typeof transaction) => Promise<unknown>,
			) => callback(transaction),
		} as never);

		await expect(
			repository.consumeLineEnrollmentState("state-1"),
		).resolves.toEqual({
			identifier: "social-account:line:enrollment:user-1",
			value: "stored-state",
		});
		expect(findArgs).toEqual({
			where: { id: "state-1" },
			select: { identifier: true, value: true },
		});
		expect(deleteArgs).toMatchObject({
			where: {
				id: "state-1",
				identifier: "social-account:line:enrollment:user-1",
				expiresAt: { gt: expect.any(Date) },
			},
		});
	});

	test("does not consume a non-LINE, expired, or already-consumed state", async () => {
		let deletes = 0;
		const transaction = {
			verification: {
				findUnique: async () => ({
					identifier: "email-verification",
					value: "x",
				}),
				deleteMany: async () => {
					deletes += 1;
					return { count: 1 };
				},
			},
		};
		const repository = new SocialAccountRepository({
			$transaction: async (
				callback: (tx: typeof transaction) => Promise<unknown>,
			) => callback(transaction),
		} as never);

		await expect(
			repository.consumeLineEnrollmentState("state-1"),
		).resolves.toBeNull();
		expect(deletes).toBe(0);

		transaction.verification.findUnique = async () => ({
			identifier: "social-account:line:enrollment:user-1",
			value: "stored-state",
		});
		transaction.verification.deleteMany = async () => ({ count: 0 });
		await expect(
			repository.consumeLineEnrollmentState("state-1"),
		).resolves.toBeNull();
	});
});

describe("SocialAccountRepository Google enrollment state", () => {
	test("stores and atomically consumes only an unexpired Google-specific state", async () => {
		let createArgs: unknown;
		let deleteArgs: unknown;
		const transaction = {
			verification: {
				findUnique: async () => ({
					identifier: getGoogleEnrollmentIdentifier("user-1"),
					value: "stored-state",
				}),
				deleteMany: async (args: unknown) => {
					deleteArgs = args;
					return { count: 1 };
				},
				create: async (args: unknown) => {
					createArgs = args;
				},
			},
		};
		const repository = new SocialAccountRepository({
			verification: transaction.verification,
			$transaction: async (
				callback: (tx: typeof transaction) => Promise<unknown>,
			) => callback(transaction),
		} as never);

		await repository.createGoogleEnrollmentState({
			state: "state-1",
			identifier: getGoogleEnrollmentIdentifier("user-1"),
			value: "stored-state",
			expiresAt: new Date("2026-11-20T00:10:00.000Z"),
		});
		await expect(
			repository.consumeGoogleEnrollmentState("state-1"),
		).resolves.toEqual({
			identifier: getGoogleEnrollmentIdentifier("user-1"),
			value: "stored-state",
		});
		expect(createArgs).toEqual({
			data: {
				id: "state-1",
				identifier: getGoogleEnrollmentIdentifier("user-1"),
				value: "stored-state",
				expiresAt: new Date("2026-11-20T00:10:00.000Z"),
			},
		});
		expect(deleteArgs).toMatchObject({
			where: {
				id: "state-1",
				identifier: getGoogleEnrollmentIdentifier("user-1"),
				expiresAt: { gt: expect.any(Date) },
			},
		});
	});

	test("does not consume cross-provider, expired, or replayed Google state", async () => {
		let deletes = 0;
		const transaction = {
			verification: {
				findUnique: async () => ({
					identifier: "social-account:line:enrollment:user-1",
					value: "stored-state",
				}),
				deleteMany: async () => {
					deletes += 1;
					return { count: 1 };
				},
			},
		};
		const repository = new SocialAccountRepository({
			$transaction: async (
				callback: (tx: typeof transaction) => Promise<unknown>,
			) => callback(transaction),
		} as never);

		await expect(
			repository.consumeGoogleEnrollmentState("state-1"),
		).resolves.toBeNull();
		expect(deletes).toBe(0);

		transaction.verification.findUnique = async () => ({
			identifier: getGoogleEnrollmentIdentifier("user-1"),
			value: "stored-state",
		});
		transaction.verification.deleteMany = async () => ({ count: 0 });
		await expect(
			repository.consumeGoogleEnrollmentState("state-1"),
		).resolves.toBeNull();
	});
});

describe("SocialAccountRepository.createLineAccount", () => {
	test("creates a token-free LINE account when no provider identity exists", async () => {
		let createArgs: unknown;
		const transaction = {
			account: {
				findFirst: async () => null,
				create: async (args: unknown) => {
					createArgs = args;
				},
			},
		};
		const repository = new SocialAccountRepository({
			$transaction: async (
				callback: (tx: typeof transaction) => Promise<unknown>,
			) => callback(transaction),
			account: transaction.account,
		} as never);

		await expect(
			repository.createLineAccount("user-1", "line-subject"),
		).resolves.toBe("created");
		expect(createArgs).toMatchObject({
			data: {
				id: expect.any(String),
				providerId: "line",
				accountId: "line-subject",
				userId: "user-1",
			},
		});
		expect(createArgs).not.toMatchObject({
			data: expect.objectContaining({
				accessToken: expect.anything(),
				idToken: expect.anything(),
				refreshToken: expect.anything(),
			}),
		});
	});

	test.each([
		["same user", "user-1", "already-linked"],
		["another user", "user-2", "linked-to-another-user"],
	] as const)("returns idempotent result when identity belongs to %s", async (_case, existingUserId, result) => {
		const transaction = {
			account: {
				findFirst: async () => ({ userId: existingUserId }),
				create: async () => {
					throw new Error("must not create an existing account");
				},
			},
		};
		const repository = new SocialAccountRepository({
			$transaction: async (
				callback: (tx: typeof transaction) => Promise<unknown>,
			) => callback(transaction),
			account: transaction.account,
		} as never);

		await expect(
			repository.createLineAccount("user-1", "line-subject"),
		).resolves.toBe(result);
	});

	test("recovers a unique race by resolving the owner after the conflict", async () => {
		let fallbackLookup = 0;
		const transaction = {
			account: {
				findFirst: async () => null,
				create: async () => {
					throw { code: "P2002" };
				},
			},
		};
		const repository = new SocialAccountRepository({
			$transaction: async (
				callback: (tx: typeof transaction) => Promise<unknown>,
			) => callback(transaction),
			account: {
				...transaction.account,
				findFirst: async () => {
					fallbackLookup += 1;
					return { userId: "user-2" };
				},
			},
		} as never);

		await expect(
			repository.createLineAccount("user-1", "line-subject"),
		).resolves.toBe("linked-to-another-user");
		expect(fallbackLookup).toBe(1);
	});
});

describe("SocialAccountRepository.createGoogleAccount", () => {
	test("creates a token-free Google identity without colliding with the same LINE subject", async () => {
		const accounts: Array<{
			providerId: string;
			accountId: string;
			userId: string;
			data: Record<string, unknown>;
		}> = [];
		const account = {
			findFirst: async ({
				where,
			}: {
				where: { providerId: string; accountId: string };
			}) =>
				accounts.find(
					(item) =>
						item.providerId === where.providerId &&
						item.accountId === where.accountId,
				)
					? { userId: "user-1" }
					: null,
			create: async ({ data }: { data: Record<string, unknown> }) => {
				accounts.push({
					providerId: String(data.providerId),
					accountId: String(data.accountId),
					userId: String(data.userId),
					data,
				});
			},
		};
		const repository = new SocialAccountRepository({
			account,
			$transaction: async (
				callback: (tx: { account: typeof account }) => Promise<unknown>,
			) => callback({ account }),
		} as never);

		await expect(
			repository.createLineAccount("user-1", "shared-subject"),
		).resolves.toBe("created");
		await expect(
			repository.createGoogleAccount("user-1", "shared-subject"),
		).resolves.toBe("created");
		expect(accounts).toHaveLength(2);
		expect(
			accounts.map(({ providerId, accountId }) => ({ providerId, accountId })),
		).toEqual([
			{ providerId: "line", accountId: "shared-subject" },
			{ providerId: "google", accountId: "shared-subject" },
		]);
		for (const { data } of accounts) {
			expect(data).not.toMatchObject({
				accessToken: expect.anything(),
				idToken: expect.anything(),
				refreshToken: expect.anything(),
				password: expect.anything(),
			});
		}
	});

	test.each([
		["same user", "user-1", "already-linked"],
		["another user", "user-2", "linked-to-another-user"],
	] as const)("returns %s ownership result", async (_case, existingUserId, result) => {
		const account = {
			findFirst: async () => ({ userId: existingUserId }),
			create: async () => {
				throw new Error("must not create an existing account");
			},
		};
		const repository = new SocialAccountRepository({
			account,
			$transaction: async (
				callback: (tx: { account: typeof account }) => Promise<unknown>,
			) => callback({ account }),
		} as never);

		await expect(
			repository.createGoogleAccount("user-1", "google-subject"),
		).resolves.toBe(result);
	});

	test("resolves a unique race with provider-scoped ownership", async () => {
		let fallbackLookup = 0;
		const transaction = {
			account: {
				findFirst: async () => null,
				create: async () => {
					throw { code: "P2002" };
				},
			},
		};
		const repository = new SocialAccountRepository({
			$transaction: async (
				callback: (tx: typeof transaction) => Promise<unknown>,
			) => callback(transaction),
			account: {
				...transaction.account,
				findFirst: async (args: unknown) => {
					fallbackLookup += 1;
					expect(args).toEqual({
						where: { providerId: "google", accountId: "google-subject" },
						select: { userId: true },
					});
					return { userId: "user-2" };
				},
			},
		} as never);

		await expect(
			repository.createGoogleAccount("user-1", "google-subject"),
		).resolves.toBe("linked-to-another-user");
		expect(fallbackLookup).toBe(1);
	});
});
