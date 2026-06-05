import { z } from "zod";

export type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

// Schema for the form - uses HH:MM format for time
export const scheduleSchema = z
  .object({
    classId: z.string().min(1, "Class is required"),
    date: z.string().min(1, "Date is required"),
    time: z.string().optional(),
    durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
    notes: z.string().optional(),
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
    recurring: z.object({
      scheduleItems: z.array(z.object({
        weekday: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
        time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      })).min(1, "At least one weekday must be selected"),
    }).optional(),
  })
  .refine((data) => {
    if (!data.recurring) {
      return data.time !== undefined && data.time !== "";
    }
    return true;
  }, { message: "Time is required for one-time schedules", path: ["time"] });

export type ScheduleFormData = z.infer<typeof scheduleSchema>;

// Helper function to convert minutes since midnight to HH:MM format
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

// Helper function to convert HH:MM format to minutes since midnight
export function timeStringToMinutes(timeString: string): number {
  const parts = timeString.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  return hours * 60 + minutes;
}
