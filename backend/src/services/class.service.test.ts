import { describe, expect, test } from "bun:test";
import type {
	ClassDeleteOutcome,
	IClassRepository,
} from "../types/class.types";
import { ClassService } from "./class.service";

function repositoryForDelete(outcome: ClassDeleteOutcome) {
	let deleteCalls = 0;
	let deleteArgs: [string, string] | undefined;
	const repository = {
		delete: async (id: string, tutorId: string) => {
			deleteCalls += 1;
			deleteArgs = [id, tutorId];
			return outcome;
		},
		findById: async () => {
			throw new Error("delete should not prefetch the class");
		},
	} as unknown as IClassRepository;

	return {
		repository,
		getDeleteArgs: () => deleteArgs,
		getDeleteCalls: () => deleteCalls,
	};
}

describe("ClassService", () => {
	test("deletes a tutor-owned class with one repository call", async () => {
		const { repository, getDeleteArgs, getDeleteCalls } =
			repositoryForDelete("deleted");
		const service = new ClassService(repository);

		await service.deleteClass("class-1", "tutor-1");
		expect(getDeleteCalls()).toBe(1);
		expect(getDeleteArgs()).toEqual(["class-1", "tutor-1"]);
	});

	test("returns the same not-found error for missing and foreign-owned classes", async () => {
		for (const classId of ["missing-class", "foreign-class"]) {
			const { repository } = repositoryForDelete("not_found");
			const service = new ClassService(repository);

			await expect(
				service.deleteClass(classId, "tutor-1"),
			).rejects.toMatchObject({
				errorCode: "CLASS_NOT_FOUND",
				status: 404,
			});
		}
	});
});
