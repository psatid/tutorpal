import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import type { PostV1CoursesBody } from "@/api/generated/models/postV1CoursesBody";
import type { PutV1CoursesByIdBody } from "@/api/generated/models/putV1CoursesByIdBody";
import { apiClient } from "@/lib/api-client";
import { coursesQueryKeys } from "@/constants/query-keys/courses-query-keys";

export function useCreateCourse(onSuccess?: () => void) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: PostV1CoursesBody) => (await apiClient.postV1Courses(data)).data,
		onSuccess: () => {
			toast.success("Course created.");
			queryClient.invalidateQueries({ queryKey: coursesQueryKeys.all });
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message || "We couldn't create this course."),
	});
}

export function useUpdateCourse(onSuccess?: () => void) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: PutV1CoursesByIdBody }) => (await apiClient.putV1CoursesById(id, data)).data,
		onSuccess: () => {
			toast.success("Course updated.");
			queryClient.invalidateQueries({ queryKey: coursesQueryKeys.all });
			onSuccess?.();
		},
		onError: (error: Error) => toast.error(error.message || "We couldn't update this course."),
	});
}

export function useDeleteCourse(onSuccess?: () => void) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => apiClient.deleteV1CoursesById(id),
		onSuccess: () => {
			toast.success("Course deleted.");
			queryClient.invalidateQueries({ queryKey: coursesQueryKeys.all });
			onSuccess?.();
		},
		onError: (error: Error) => {
			const payload = isAxiosError(error)
				? (error.response?.data as { errorCode?: string; message?: string } | undefined)
				: undefined;
			toast.error(
				payload?.errorCode === "COURSE_IN_USE"
					? "This course still has classes. Open its classes before deleting it."
					: payload?.message || error.message || "We couldn't delete this course.",
			);
		},
	});
}
