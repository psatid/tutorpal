export type EligibleTutorUser = {
	id: string;
	email: string;
	role: string | null;
	banned: boolean | null;
	tutor: { id: string } | null;
};

export type StoredLineEnrollmentState = {
	identifier: string;
	value: string;
};

export interface ISocialAccountRepository {
	findEligibleTutorUser(userId: string): Promise<EligibleTutorUser | null>;
	createLineEnrollmentState(input: {
		state: string;
		identifier: string;
		value: string;
		expiresAt: Date;
	}): Promise<void>;
	consumeLineEnrollmentState(
		state: string,
	): Promise<StoredLineEnrollmentState | null>;
	createLineAccount(
		userId: string,
		accountId: string,
	): Promise<"created" | "already-linked" | "linked-to-another-user">;
}
