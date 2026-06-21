import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	classesKeys,
	schedulesKeys,
	studentsKeys,
} from "@/hooks/queries/query-keys";
import { apiClient } from "@/lib/api-client";
import type { Weekday } from "@/types/schedule";

export const useCreateSchedule = (options?: { onSuccess?: () => void }) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			classId: string;
			date: string;
			time: number;
			durationMinutes?: number;
			notes?: string;
			status?: "SCHEDULED" | "COMPLETED" | "CANCELLED";
			recurring?: {
				startDate: string;
				scheduleItems: Array<{
					weekday: Weekday;
					time: number;
					durationMinutes: number;
				}>;
			};
		}) => {
			const payload: {
				classId: string;
				date: string;
				time: number;
				durationMinutes?: number;
				notes?: string;
				status?: "SCHEDULED" | "COMPLETED" | "CANCELLED";
				recurring?: {
					startDate: string;
					scheduleItems: Array<{
						weekday: Weekday;
						time: number;
						durationMinutes: number;
					}>;
				};
			} = {
				classId: data.classId,
				date: data.recurring ? data.recurring.startDate : data.date,
				time: data.recurring ? 0 : data.time, // Time is ignored for recurring schedules
				durationMinutes: data.durationMinutes,
				notes: data.notes,
				status: data.status,
			};

			if (data.recurring) {
				payload.recurring = {
					startDate: data.recurring.startDate,
					scheduleItems: data.recurring.scheduleItems.map((item) => ({
						weekday: item.weekday,
						time: item.time,
						durationMinutes: item.durationMinutes,
					})),
				};
			}

			const response = await apiClient.postV1Schedules(payload);
			return response.data;
		},
		onSuccess: () => {
			toast.success("Schedule created successfully.");
			queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
			queryClient.invalidateQueries({ queryKey: classesKeys.all });
			queryClient.invalidateQueries({ queryKey: studentsKeys.all });
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message || "Failed to create schedule. Please try again.",
			);
		},
	});
};

export const useUpdateSchedule = (options?: { onSuccess?: () => void }) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: Partial<{
				classId: string;
				date: string;
				time: number;
				durationMinutes: number;
				notes?: string;
				status?: "SCHEDULED" | "COMPLETED" | "CANCELLED";
			}>;
		}) => {
			const response = await apiClient.putV1SchedulesById(id, data);
			return response.data;
		},
		onSuccess: (_, variables) => {
			toast.success("Schedule updated successfully.");
			queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: classesKeys.all });
			queryClient.invalidateQueries({ queryKey: studentsKeys.all });
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message || "Failed to update schedule. Please try again.",
			);
		},
	});
};

export const useDeleteSchedule = (options?: { onSuccess?: () => void }) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await apiClient.deleteV1SchedulesById(id);
		},
		onSuccess: () => {
			toast.success("Schedule deleted successfully.");
			queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
			queryClient.invalidateQueries({ queryKey: classesKeys.all });
			queryClient.invalidateQueries({ queryKey: studentsKeys.all });
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message || "Failed to delete schedule. Please try again.",
			);
		},
	});
};

export const useCompleteSchedule = (options?: { onSuccess?: () => void }) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const response = await apiClient.patchV1SchedulesByIdComplete(id);
			return response.data;
		},
		onSuccess: (_, variables) => {
			toast.success("Schedule completed successfully. Hours deducted.");
			queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesKeys.detail(variables),
			});
			queryClient.invalidateQueries({ queryKey: classesKeys.all });
			queryClient.invalidateQueries({ queryKey: studentsKeys.all });
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message || "Failed to complete schedule. Please try again.",
			);
		},
	});
};

export const useRestoreHours = (options?: { onSuccess?: () => void }) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const response = await apiClient.patchV1SchedulesByIdRestore(id);
			return response.data;
		},
		onSuccess: (_, variables) => {
			toast.success("Hours restored successfully.");
			queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesKeys.detail(variables),
			});
			queryClient.invalidateQueries({ queryKey: classesKeys.all });
			queryClient.invalidateQueries({ queryKey: studentsKeys.all });
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message || "Failed to restore hours. Please try again.",
			);
		},
	});
};
