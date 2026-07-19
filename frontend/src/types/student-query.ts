import type { Student } from "@/models/student";

export type StudentSortBy = "name" | "phoneNumber" | "grade" | "createdAt";
export type StudentSortOrder = "asc" | "desc";

export type StudentListFilters = {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: StudentSortBy;
	sortOrder?: StudentSortOrder;
};

export type InfiniteStudentListFilters = Omit<StudentListFilters, "page">;

export type StudentList = {
	students: Student[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
};
