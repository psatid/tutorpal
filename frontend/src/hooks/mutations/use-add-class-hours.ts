import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { PostV1ClassesByIdHourAdditions200 } from "@/api/generated/models/postV1ClassesByIdHourAdditions200";
import type { PostV1ClassesByIdHourAdditionsBody } from "@/api/generated/models/postV1ClassesByIdHourAdditionsBody";
import { classHourAdditionsQueryKeys } from "@/constants/query-keys/class-hour-additions-query-keys";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { coursesQueryKeys } from "@/constants/query-keys/courses-query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import { apiClient } from "@/lib/api-client";

export type ClassHourAdditionErrorKind =
	| "course-unavailable"
	| "class-not-found"
	| "request-conflict"
	| "unknown";

export class ClassHourAdditionError extends Error {
	constructor(readonly kind: ClassHourAdditionErrorKind) {
		super("Adding class hours failed");
		this.name = "ClassHourAdditionError";
	}
}

function classifyClassHourAdditionError(error: unknown): ClassHourAdditionError {
	if (!isAxiosError(error)) return new ClassHourAdditionError("unknown");

	const payload = error.response?.data as { errorCode?: string } | undefined;
	if (payload?.errorCode === "COURSE_NOT_FOUND") {
		return new ClassHourAdditionError("course-unavailable");
	}
	if (payload?.errorCode === "CLASS_NOT_FOUND" || error.response?.status === 404) {
		return new ClassHourAdditionError("class-not-found");
	}
	if (error.response?.status === 409) {
		return new ClassHourAdditionError("request-conflict");
	}

	return new ClassHourAdditionError("unknown");
}

export function useAddClassHours(options?: {
	onSuccess?: (result: PostV1ClassesByIdHourAdditions200) => void;
	onError?: (error: ClassHourAdditionError) => void;
}) {
	const queryClient = useQueryClient();

	return useMutation<
		PostV1ClassesByIdHourAdditions200,
		ClassHourAdditionError,
		{ classId: string; data: PostV1ClassesByIdHourAdditionsBody }
	>({
		mutationFn: async ({ classId, data }) => {
			try {
				return (
					await apiClient.postV1ClassesByIdHourAdditions(classId, data)
				).data;
			} catch (error) {
				throw classifyClassHourAdditionError(error);
			}
		},
		onSuccess: async (result, { classId, data }) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: classesQueryKeys.all }),
				queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all }),
				...(data.source === "course"
					? [
							queryClient.invalidateQueries({
								queryKey: coursesQueryKeys.detail(data.courseId),
							}),
						]
					: []),
				queryClient.invalidateQueries({
					queryKey: classHourAdditionsQueryKeys.listsForClass(classId),
				}),
				queryClient.invalidateQueries({
					queryKey: classHourAdditionsQueryKeys.infinite(classId),
				}),
			]);
			options?.onSuccess?.(result);
		},
		onError: (error) => options?.onError?.(error),
	});
}
