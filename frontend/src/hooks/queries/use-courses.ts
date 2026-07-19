import type { GetV1Courses200 } from "@/api/generated/models/getV1Courses200";
import { Course } from "@/models/course";
import type { CourseList, CourseListFilters } from "@/types/course-query";
import { useFetchCourses } from "./use-fetch-courses";

const selectCourseList = (data: GetV1Courses200 | undefined): CourseList => ({
	courses: data?.data.map(Course.fromListItem) ?? [],
	pagination: {
		total: data?.pagination.total ?? 0,
		page: data?.pagination.page ?? 1,
		limit: data?.pagination.limit ?? 0,
		totalPages: data?.pagination.totalPages ?? 0,
		hasNext: data?.pagination.hasNext ?? false,
		hasPrev: data?.pagination.hasPrev ?? false,
	},
});

export const useCourses = (filters?: CourseListFilters) =>
	useFetchCourses({ filters, select: selectCourseList });
