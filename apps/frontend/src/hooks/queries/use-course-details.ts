import type { GetV1CoursesById200 } from "@/api/generated/models/getV1CoursesById200";
import { Course } from "@/models/course";
import { useFetchCourseById } from "./use-fetch-course-by-id";

const selectCourseDetails = (data: GetV1CoursesById200 | undefined) =>
	data ? Course.fromGetCourseByIdResponse(data) : undefined;

export function useCourseDetails(courseId: string | null) {
	return useFetchCourseById({ courseId, select: selectCourseDetails });
}
