import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { schedulesKeys } from "@/hooks/queries/query-keys";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import { apiClient } from "@/lib/api-client";
import type { ScheduleType, Weekday } from "@/types/schedule";

export const useCreateSchedule = (options?: { onSuccess?: () => void }) => {
	const { t } = useTranslation("schedules");
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			classId: string;
			date: string;
			type: ScheduleType;
			time: number;
			durationMinutes?: number;
			notes?: string;
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
				type: ScheduleType;
				time: number;
				durationMinutes?: number;
				notes?: string;
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
				type: data.type,
				time: data.recurring ? 0 : data.time, // Time is ignored for recurring schedules
				durationMinutes: data.durationMinutes,
				notes: data.notes,
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
			toast.success(t("toast.createSuccess"));
			queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
			queryClient.invalidateQueries({ queryKey: classesQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all });
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message || t("toast.createError"),
			);
		},
	});
};

export const useUpdateSchedule = (options?: { onSuccess?: () => void }) => {
	const { t } = useTranslation("schedules");
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
				type?: ScheduleType;
				time: number;
				durationMinutes: number;
				notes?: string;
				status?: "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
			}>;
		}) => {
			const response = await apiClient.putV1SchedulesById(id, data);
			return response.data;
		},
		onSuccess: (_, variables) => {
			toast.success(t("toast.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: classesQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all });
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message || t("toast.updateError"),
			);
		},
	});
};

export const useDeleteSchedule = (options?: { onSuccess?: () => void }) => {
	const { t } = useTranslation("schedules");
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await apiClient.deleteV1SchedulesById(id);
		},
		onSuccess: () => {
			toast.success(t("toast.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
			queryClient.invalidateQueries({ queryKey: classesQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all });
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message || t("toast.deleteError"),
			);
		},
	});
};

export const useCompleteSchedule = (options?: { onSuccess?: () => void }) => {
	const { t } = useTranslation("schedules");
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const response = await apiClient.patchV1SchedulesByIdComplete(id);
			return response.data;
		},
		onSuccess: (_, variables) => {
			toast.success(t("toast.completeSuccess"));
			queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesKeys.detail(variables),
			});
			queryClient.invalidateQueries({ queryKey: classesQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all });
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message || t("toast.completeError"),
			);
		},
	});
};

export const useRestoreHours = (options?: { onSuccess?: () => void }) => {
	const { t } = useTranslation("schedules");
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const response = await apiClient.patchV1SchedulesByIdRestore(id);
			return response.data;
		},
		onSuccess: (_, variables) => {
			toast.success(t("toast.restoreSuccess"));
			queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesKeys.detail(variables),
			});
			queryClient.invalidateQueries({ queryKey: classesQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all });
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message || t("toast.restoreError"),
			);
		},
	});
};

export const useUpdateRecurringSchedule = (options?: { onSuccess?: () => void }) => {
	const { t } = useTranslation("schedules");
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: {
				effectiveDate: string;
				type?: ScheduleType;
				scheduleItems: Array<{
					weekday: Weekday;
					time: number;
					durationMinutes: number;
				}>;
			};
		}) => {
			const response = await apiClient.patchV1SchedulesRecurringById(id, data);
			return response.data;
		},
		onSuccess: () => {
			toast.success(t("toast.recurringUpdateSuccess"));
			queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
			queryClient.invalidateQueries({ queryKey: classesQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all });
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
					error.message || t("toast.recurringUpdateError"),
			);
		},
	});
};
