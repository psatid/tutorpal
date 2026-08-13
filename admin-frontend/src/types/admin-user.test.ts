import { describe, expect, test } from "bun:test";
import type { TFunction } from "i18next";
import {
	adminUserSearchSchema,
	createAdminUserPasswordSchema,
} from "@/types/admin-user";

const translate = ((key: string) => key) as TFunction;

describe("admin user route state", () => {
	test("applies safe defaults for an empty search", () => {
		expect(adminUserSearchSchema.parse({})).toEqual({
			search: "",
			status: "all",
			page: 1,
		});
	});

	test("coerces a URL page and preserves supported filters", () => {
		expect(
			adminUserSearchSchema.parse({
				search: "  somchai  ",
				status: "deactivated",
				page: "2",
			}),
		).toEqual({
			search: "  somchai  ",
			status: "deactivated",
			page: 2,
		});
	});
});

describe("admin user password form", () => {
	const schema = createAdminUserPasswordSchema(translate);

	test("accepts matching passwords of the minimum length", () => {
		expect(
			schema.safeParse({
				newPassword: "password123",
				confirmPassword: "password123",
			}).success,
		).toBe(true);
	});

	test("reports a mismatch on the confirmation field", () => {
		const result = schema.safeParse({
			newPassword: "password123",
			confirmPassword: "password456",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toContainEqual({
				code: "custom",
				message: "form.passwordsDoNotMatch",
				path: ["confirmPassword"],
			});
		}
	});
});
