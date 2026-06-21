import { resolver } from "hono-openapi";
import { z } from "zod";

// Schedule status enum
export const ScheduleStatusSchema = z.enum([
  "SCHEDULED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
]);

// Weekday enum
export const WeekdaySchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

// Recurring schedule item schema
const RecurringScheduleItemSchema = z.object({
  weekday: WeekdaySchema,
  time: z.number().int().min(0).max(1439), // 0 to 23:59 in minutes
  durationMinutes: z.number().int().min(1),
});

// Recurring pattern schema
const RecurringPatternSchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
    scheduleItems: z
      .array(RecurringScheduleItemSchema)
      .min(1, "At least one weekday must be selected"),
  })
  .optional();

// Base schedule schema (matches Prisma model with class name)
export const ScheduleSchema = z.object({
  id: z.string(),
  classId: z.string(),
  className: z.string(),
  date: z.string(), // ISO date string (YYYY-MM-DD)
  time: z.number().int().min(0).max(1439), // Minutes since midnight (0-1439)
  durationMinutes: z.number().int().min(1), // At least 1 minute
  notes: z.string().nullable(),
  status: ScheduleStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  remainingHours: z.number().optional(),
});

// Request schemas
export const CreateScheduleSchema = z
  .object({
    classId: z.string().min(1, "Class is required"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    time: z
      .number()
      .int()
      .min(0)
      .max(1439, "Time must be between 0 and 1439 minutes")
      .optional(),
    durationMinutes: z
      .number()
      .int()
      .min(1, "Duration must be at least 1 minute")
      .optional(),
    notes: z.string().optional(),
    recurring: RecurringPatternSchema,
  })
  .superRefine((data, ctx) => {
    if (data.recurring) {
      return;
    }

    if (data.time === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["time"],
        message: "Time is required",
      });
    }

    if (data.durationMinutes === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["durationMinutes"],
        message: "Duration must be at least 1 minute",
      });
    }
  });

export const UpdateScheduleSchema = z.object({
  classId: z.string().min(1, "Class is required").optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  time: z
    .number()
    .int()
    .min(0)
    .max(1439, "Time must be between 0 and 1439 minutes")
    .optional(),
  durationMinutes: z
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute")
    .optional(),
  notes: z.string().optional(),
  status: ScheduleStatusSchema.optional(),
});

// Query schema for listing schedules
export const ScheduleListQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  search: z.string().optional(),
  classId: z.string().optional(),
});

// OpenAPI resolvers
export const ScheduleSchemaResolver = resolver(ScheduleSchema);
export const CreateScheduleSchemaResolver = resolver(CreateScheduleSchema);
export const UpdateScheduleSchemaResolver = resolver(UpdateScheduleSchema);
export const ScheduleListSchemaResolver = resolver(z.array(ScheduleSchema));
export const ScheduleListQuerySchemaResolver = resolver(
  ScheduleListQuerySchema,
);

// Type exports
export type ScheduleSchemaType = z.infer<typeof ScheduleSchema>;
export type CreateScheduleSchemaType = z.infer<typeof CreateScheduleSchema>;
export type UpdateScheduleSchemaType = z.infer<typeof UpdateScheduleSchema>;
export type ScheduleStatusSchemaType = z.infer<typeof ScheduleStatusSchema>;
export type WeekdaySchemaType = z.infer<typeof WeekdaySchema>;
export type RecurringPatternSchemaType = z.infer<typeof RecurringPatternSchema>;
export type ScheduleListQuerySchemaType = z.infer<
  typeof ScheduleListQuerySchema
>;
