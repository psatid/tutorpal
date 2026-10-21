import { describe, expect, test } from "bun:test";
import { LineRepository } from "./line.repository";

describe("LineRepository callback state lookups", () => {
	test("recognizes existing student and test-recipient tokens without validity filtering", async () => {
		let studentLookup: unknown;
		let testRecipientLookup: unknown;
		const repository = new LineRepository({
			lineLinkToken: {
				findUnique: async (args: unknown) => {
					studentLookup = args;
					return { id: "student-token-record" };
				},
			},
			lineTestRecipientToken: {
				findUnique: async (args: unknown) => {
					testRecipientLookup = args;
					return { id: "test-recipient-token-record" };
				},
			},
		} as never);

		expect(await repository.hasToken("student-token")).toBe(true);
		expect(await repository.hasTestRecipientToken("test-recipient-token")).toBe(
			true,
		);
		expect(studentLookup).toEqual({
			where: { token: "student-token" },
			select: { id: true },
		});
		expect(testRecipientLookup).toEqual({
			where: { token: "test-recipient-token" },
			select: { id: true },
		});
	});

	test("returns false when a callback state has no token record", async () => {
		const repository = new LineRepository({
			lineLinkToken: { findUnique: async () => null },
			lineTestRecipientToken: { findUnique: async () => null },
		} as never);

		expect(await repository.hasToken("missing-token")).toBe(false);
		expect(await repository.hasTestRecipientToken("missing-token")).toBe(false);
	});
});
