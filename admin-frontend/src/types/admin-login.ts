import type { TFunction } from "i18next";
import { z } from "zod";

export function createAdminLoginSchema(t: TFunction) {
	return z.object({
		email: z.string().trim().pipe(z.email(t("form.invalidEmail"))),
		password: z.string().min(1, t("form.required")),
	});
}

export type AdminLoginFormData = z.output<
	ReturnType<typeof createAdminLoginSchema>
>;
