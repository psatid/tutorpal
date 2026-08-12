import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { PostV1CoursesBody } from "@/api/generated/models/postV1CoursesBody";
import type { PutV1CoursesByIdBody } from "@/api/generated/models/putV1CoursesByIdBody";
import { apiClient } from "@/lib/api-client";
import { coursesQueryKeys } from "@/constants/query-keys/courses-query-keys";

export type CourseDeleteErrorKind = "not-found" | "unknown";

export class CourseDeleteError extends Error {
	constructor(readonly kind: CourseDeleteErrorKind) {
		super("Course deletion failed");
		this.name = "CourseDeleteError";
	}
}

function classifyCourseDeleteError(error: unknown): CourseDeleteError {
	if (!isAxiosError(error)) return new CourseDeleteError("unknown");

	const payload = error.response?.data as { errorCode?: string } | undefined;
	if (
		payload?.errorCode === "COURSE_NOT_FOUND" ||
		error.response?.status === 404
	) {
		return new CourseDeleteError("not-found");
	}

	return new CourseDeleteError("unknown");
}

export function useCreateCourse(onSuccess?: () => void) {
	const { t } = useTranslation("courses");
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: PostV1CoursesBody) => (await apiClient.postV1Courses(data)).data,
		onSuccess: () => {
			toast.success(t("toast.createSuccess"));
			queryClient.invalidateQueries({ queryKey: coursesQueryKeys.all });
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message || t("toast.createError")),
	});
}

export function useUpdateCourse(onSuccess?: () => void) {
	const { t } = useTranslation("courses");
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: PutV1CoursesByIdBody }) => (await apiClient.putV1CoursesById(id, data)).data,
		onSuccess: () => {
			toast.success(t("toast.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: coursesQueryKeys.all });
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message || t("toast.updateError")),
	});
}

export function useDeleteCourse(options?: {
	onSuccess?: (id: string) => void;
	onError?: (error: CourseDeleteError, id: string) => void | Promise<void>;
}) {
	const queryClient = useQueryClient();
	return useMutation<void, CourseDeleteError, string>({
		mutationFn: async (id) => {
			try {
				await apiClient.deleteV1CoursesById(id);
			} catch (error) {
				throw classifyCourseDeleteError(error);
			}
		},
		onSuccess: async (_, id) => {
			await queryClient.invalidateQueries({ queryKey: coursesQueryKeys.all });
			options?.onSuccess?.(id);
		},
		onError: async (error, id) => {
			if (error.kind === "not-found") {
				await queryClient.invalidateQueries({ queryKey: coursesQueryKeys.all });
			}
			await options?.onError?.(error, id);
		},
	});
}
