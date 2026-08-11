import { z } from "zod";

const classNameError = "Enter a class name.";

export const classFormSchema = z.object({
	name: z.string().trim().min(1, classNameError),
	studentIds: z.array(z.string()),
});

export type ClassFormInput = z.input<typeof classFormSchema>;
export type ClassFormValues = z.output<typeof classFormSchema>;
export type ClassFormData = ClassFormValues;
