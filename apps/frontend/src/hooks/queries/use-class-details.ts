import type { GetV1ClassesById200 } from "@/api/generated/models/getV1ClassesById200";
import { Class } from "@/models/class";
import { useFetchClassById } from "./use-fetch-class-by-id";

const selectClassDetails = (data: GetV1ClassesById200 | undefined) =>
	data ? Class.fromGetClassByIdResponse(data) : undefined;

export const useClassDetails = (classId: string | null) =>
	useFetchClassById({ classId, select: selectClassDetails });
