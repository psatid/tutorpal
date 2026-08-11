import { describe, expect, mock, test } from "bun:test";
import { Prisma } from "@prisma/client";

type DeleteArgs = Prisma.CourseDeleteArgs;

let deleteCourse: (args: DeleteArgs) => Promise<unknown>;

mock.module("../lib/db", () => ({
	prisma: {
		course: {
			delete: (args: DeleteArgs) => deleteCourse(args),
		},
	},
}));

const { CourseRepository } = await import("./course.repository");

function knownRequestError(code: "P2022" | "P2025") {
	return new Prisma.PrismaClientKnownRequestError("Database request failed", {
		code,
		clientVersion: Prisma.prismaVersion.client,
	});
}

describe("CourseRepository.delete", () => {
	test("deletes only the tutor-owned course", async () => {
		let deleteArgs: DeleteArgs | undefined;
		deleteCourse = async (args) => {
			deleteArgs = args;
			return {};
		};

		await expect(
			new CourseRepository().delete("course-1", "tutor-1"),
		).resolves.toBe("deleted");
		expect(deleteArgs).toEqual({
			where: { id: "course-1", tutorId: "tutor-1" },
		});
	});

	test("maps P2025 to not_found", async () => {
		deleteCourse = async () => {
			throw knownRequestError("P2025");
		};

		await expect(
			new CourseRepository().delete("course-1", "tutor-1"),
		).resolves.toBe("not_found");
	});

	test("rethrows unrelated Prisma errors", async () => {
		const unexpectedError = knownRequestError("P2022");
		deleteCourse = async () => {
			throw unexpectedError;
		};

		await expect(
			new CourseRepository().delete("course-1", "tutor-1"),
		).rejects.toBe(unexpectedError);
	});
});
