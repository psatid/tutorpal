import { z } from "zod";

export interface StudentInClass {
	id: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
}

export interface Class {
	id: string;
	name: string | null;
	displayName: string;
	course: { id: string; name: string } | null;
	totalHours: number;
	students: StudentInClass[];
	remainingHours?: number;
}

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
