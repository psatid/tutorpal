import { describe, expect, mock, test } from "bun:test";
import { Prisma } from "@prisma/client";

type DeleteArgs = Prisma.ClassDeleteArgs;

let deleteClass: (args: DeleteArgs) => Promise<unknown>;

mock.module("../lib/db", () => ({
	prisma: {
		class: {
			delete: (args: DeleteArgs) => deleteClass(args),
		},
	},
}));

const { ClassRepository } = await import("./class.repository");

function knownRequestError(code: "P2022" | "P2025") {
	return new Prisma.PrismaClientKnownRequestError("Database request failed", {
		code,
		clientVersion: Prisma.prismaVersion.client,
	});
}

describe("ClassRepository.delete", () => {
	test("deletes only the tutor-owned class", async () => {
		let deleteArgs: DeleteArgs | undefined;
		let deleteCalls = 0;
		deleteClass = async (args) => {
			deleteCalls += 1;
			deleteArgs = args;
			return {};
		};

		await expect(
			new ClassRepository().delete("class-1", "tutor-1"),
		).resolves.toBe("deleted");
		expect(deleteArgs).toEqual({
			where: { id: "class-1", tutorId: "tutor-1" },
		});
		expect(deleteCalls).toBe(1);
	});

	test("maps P2025 to not_found", async () => {
		deleteClass = async () => {
			throw knownRequestError("P2025");
		};

		await expect(
			new ClassRepository().delete("class-1", "tutor-1"),
		).resolves.toBe("not_found");
	});

	test("rethrows unrelated Prisma errors", async () => {
		const unexpectedError = knownRequestError("P2022");
		deleteClass = async () => {
			throw unexpectedError;
		};

		await expect(
			new ClassRepository().delete("class-1", "tutor-1"),
		).rejects.toBe(unexpectedError);
	});
});
