import type { PrismaClient } from "@prisma/client";
import { DateTime } from "../lib/date-time";
import { prisma as defaultPrisma } from "../lib/db";
import type {
	EligibleTutorUser,
	ISocialAccountRepository,
	StoredLineEnrollmentState,
} from "../types";

const LINE_ENROLLMENT_IDENTIFIER_PREFIX = "social-account:line:enrollment:";

function isUniqueConstraintError(error: unknown) {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: unknown }).code === "P2002"
	);
}

export function getLineEnrollmentIdentifier(userId: string) {
	return `${LINE_ENROLLMENT_IDENTIFIER_PREFIX}${userId}`;
}

export class SocialAccountRepository implements ISocialAccountRepository {
	constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

	async findEligibleTutorUser(
		userId: string,
	): Promise<EligibleTutorUser | null> {
		return this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				role: true,
				banned: true,
				tutor: { select: { id: true } },
			},
		});
	}

	async createLineEnrollmentState(input: {
		state: string;
		identifier: string;
		value: string;
		expiresAt: Date;
	}): Promise<void> {
		await this.prisma.verification.create({
			data: {
				id: input.state,
				identifier: input.identifier,
				value: input.value,
				expiresAt: input.expiresAt,
			},
		});
	}

	async consumeLineEnrollmentState(
		state: string,
	): Promise<StoredLineEnrollmentState | null> {
		return this.prisma.$transaction(async (tx) => {
			const verification = await tx.verification.findUnique({
				where: { id: state },
				select: { identifier: true, value: true },
			});
			if (
				!verification ||
				!verification.identifier.startsWith(LINE_ENROLLMENT_IDENTIFIER_PREFIX)
			) {
				return null;
			}

			const consumed = await tx.verification.deleteMany({
				where: {
					id: state,
					identifier: verification.identifier,
					expiresAt: { gt: DateTime.now().toDate() },
				},
			});
			if (consumed.count !== 1) {
				return null;
			}

			return verification;
		});
	}

	async createLineAccount(userId: string, accountId: string) {
		try {
			return await this.prisma.$transaction(async (tx) => {
				const existingAccount = await tx.account.findFirst({
					where: { providerId: "line", accountId },
					select: { userId: true },
				});
				if (existingAccount) {
					return existingAccount.userId === userId
						? "already-linked"
						: "linked-to-another-user";
				}

				await tx.account.create({
					data: {
						id: crypto.randomUUID(),
						providerId: "line",
						accountId,
						userId,
					},
				});
				return "created";
			});
		} catch (error) {
			if (!isUniqueConstraintError(error)) {
				throw error;
			}

			const existingAccount = await this.prisma.account.findFirst({
				where: { providerId: "line", accountId },
				select: { userId: true },
			});
			return existingAccount?.userId === userId
				? "already-linked"
				: "linked-to-another-user";
		}
	}
}

export const socialAccountRepository = new SocialAccountRepository();
