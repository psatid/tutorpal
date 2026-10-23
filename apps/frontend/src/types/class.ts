import { z } from "zod";
import type { TFunction } from "i18next";

export function createClassFormSchema(t: TFunction) {
	return z.object({
		name: z.string().trim().min(1, t("classes:createForm.nameError")),
		studentIds: z.array(z.string()),
	});
}

export type ClassFormInput = z.input<ReturnType<typeof createClassFormSchema>>;
export type ClassFormValues = z.output<ReturnType<typeof createClassFormSchema>>;
export type ClassFormData = ClassFormValues;
