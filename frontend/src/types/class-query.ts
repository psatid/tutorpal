import type { Class } from "@/models/class";

export type ClassSortBy = "name" | "totalHours" | "createdAt";
export type ClassSortOrder = "asc" | "desc";
export type ClassType = "custom" | "course-linked";

export type ClassListFilters = {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: ClassSortBy;
	sortOrder?: ClassSortOrder;
	courseId?: string;
	classType?: ClassType;
};

export type InfiniteClassListFilters = Omit<ClassListFilters, "page">;

export type ClassList = {
	classes: Class[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
};
