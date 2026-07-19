import type { Course } from "@/models/course";

export type CourseSortBy = "name" | "defaultTotalHours" | "createdAt";
export type CourseSortOrder = "asc" | "desc";

export type CourseListFilters = {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: CourseSortBy;
	sortOrder?: CourseSortOrder;
};

export type CourseList = {
	courses: Course[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
};
