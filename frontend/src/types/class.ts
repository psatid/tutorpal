import { z } from "zod";

export interface StudentInClass {
  id: string;
  name: string;
  phoneNumber: string | null;
  grade: number;
}

export interface Class {
  id: string;
  name: string;
  totalHours: number;
  students: StudentInClass[];
  remainingHours?: number;
}

// Form schema - all fields required for form
export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  totalHours: z.number().min(1, "Total hours is required"),
  studentIds: z.array(z.string()),
});

export type ClassFormData = z.infer<typeof classSchema>;
