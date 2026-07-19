import { z } from "zod";

// Form schema - all fields required for form
export const classSchema = z.object({
	name: z.string(),
	totalHours: z
		.number()
		.finite("Total hours is required")
		.min(1, "Total hours must be at least 1"),
	studentIds: z.array(z.string()).min(1, "Select at least one student"),
});

export type ClassFormData = z.infer<typeof classSchema>;
