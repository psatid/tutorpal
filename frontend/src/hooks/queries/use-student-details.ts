import type { GetV1StudentsById200 } from "@/api/generated/models/getV1StudentsById200";
import { Student } from "@/models/student";
import { useFetchStudentById } from "./use-fetch-student-by-id";

const selectStudentDetails = (data: GetV1StudentsById200 | undefined) =>
	data ? Student.fromGetStudentByIdResponse(data) : undefined;

export const useStudentDetails = (studentId: string | null) =>
	useFetchStudentById({ studentId, select: selectStudentDetails });
