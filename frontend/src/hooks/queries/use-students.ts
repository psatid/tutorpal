import type { GetV1Students200 } from "@/api/generated/models/getV1Students200";
import { Student } from "@/models/student";
import type { StudentList, StudentListFilters } from "@/types/student-query";
import { useFetchStudents } from "./use-fetch-students";

const selectStudentList = (data: GetV1Students200 | undefined): StudentList => ({
	students: data?.data.map(Student.fromListItem) ?? [],
	pagination: {
		total: data?.pagination.total ?? 0,
		page: data?.pagination.page ?? 1,
		limit: data?.pagination.limit ?? 0,
		totalPages: data?.pagination.totalPages ?? 0,
		hasNext: data?.pagination.hasNext ?? false,
		hasPrev: data?.pagination.hasPrev ?? false,
	},
});

export const useStudents = (filters?: StudentListFilters) =>
	useFetchStudents({ filters, select: selectStudentList });
