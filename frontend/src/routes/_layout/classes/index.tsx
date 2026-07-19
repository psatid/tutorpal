import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/_layout/classes/")({
	validateSearch: z
		.object({
			courseId: z.string().optional(),
			classType: z.enum(["custom", "course-linked"]).optional(),
		})
		.refine((value) => !(value.courseId && value.classType), {
			message: "courseId and classType cannot be combined",
		}),
});
