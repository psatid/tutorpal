import type { InfiniteData } from "@tanstack/react-query";
import type { GetV1Students200 } from "@/api/generated/models/getV1Students200";
import { Student } from "@/models/student";
import type { InfiniteStudentListFilters, StudentList } from "@/types/student-query";
import { useFetchInfiniteStudents } from "./use-fetch-infinite-students";

type InfiniteStudentList = InfiniteData<StudentList>;

const selectInfiniteStudents = (
	data: InfiniteData<GetV1Students200> | undefined,
): InfiniteStudentList => ({
	pages:
		data?.pages.map((page) => ({
			students: page.data.map(Student.fromListItem),
			pagination: page.pagination,
		})) ?? [],
	pageParams: data?.pageParams ?? [],
});

export const useInfiniteStudents = (filters?: InfiniteStudentListFilters) =>
	useFetchInfiniteStudents({ filters, select: selectInfiniteStudents });
