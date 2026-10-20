import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { schedulesQueryKeys } from "@/constants/query-keys/schedules-query-keys";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import { apiClient } from "@/lib/api-client";
import type { PostV1SchedulesBody } from "@/api/generated/models/postV1SchedulesBody";
import type { PutV1SchedulesByIdBody } from "@/api/generated/models/putV1SchedulesByIdBody";
import type { PatchV1SchedulesRecurringByIdBody } from "@/api/generated/models/patchV1SchedulesRecurringByIdBody";
import type {
	ScheduleCreateCommand,
	ScheduleUpdateCommand,
} from "@/models/schedule";
import type { UpdateRecurringScheduleCommand } from "@/models/recurring-schedule";

export const useCreateSchedule = (options?: { onSuccess?: () => void }) => {
	const { t } = useTranslation("schedules");
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: ScheduleCreateCommand) => {
			const payload: PostV1SchedulesBody = {
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
			queryClient.invalidateQueries({ queryKey: schedulesQueryKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesQueryKeys.awaitingConfirmation(),
			});
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
		}: { id: string; data: ScheduleUpdateCommand }) => {
			const payload: PutV1SchedulesByIdBody = {
				classId: data.classId,
				date: data.date,
				type: data.type,
				time: data.time,
				durationMinutes: data.durationMinutes,
				notes: data.notes,
			};
			const response = await apiClient.putV1SchedulesById(id, payload);
			return response.data;
		},
		onSuccess: (_, variables) => {
			toast.success(t("toast.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: schedulesQueryKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesQueryKeys.awaitingConfirmation(),
			});
			queryClient.invalidateQueries({
				queryKey: schedulesQueryKeys.detail(variables.id),
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
			queryClient.invalidateQueries({ queryKey: schedulesQueryKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesQueryKeys.awaitingConfirmation(),
			});
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
			queryClient.invalidateQueries({ queryKey: schedulesQueryKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesQueryKeys.awaitingConfirmation(),
			});
			queryClient.invalidateQueries({
				queryKey: schedulesQueryKeys.detail(variables),
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

export const useNoShowSchedule = (options?: { onSuccess?: () => void }) => {
	const { t } = useTranslation("schedules");
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			deductHours,
			note,
		}: {
			id: string;
			deductHours: boolean;
			note?: string;
		}) => {
			const response = await apiClient.patchV1SchedulesByIdNoShow(id, {
				deductHours,
				note,
			});
			return response.data;
		},
		onSuccess: async (_, variables) => {
			toast.success(
				t(
					variables.deductHours
						? "toast.noShowDeductSuccess"
						: "toast.noShowReleaseSuccess",
				),
			);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: schedulesQueryKeys.lists() }),
				queryClient.invalidateQueries({
					queryKey: schedulesQueryKeys.awaitingConfirmation(),
				}),
				queryClient.invalidateQueries({
					queryKey: schedulesQueryKeys.detail(variables.id),
				}),
				queryClient.invalidateQueries({ queryKey: classesQueryKeys.all }),
				queryClient.invalidateQueries({ queryKey: studentsQueryKeys.all }),
			]);
			options?.onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(error.message || t("toast.noShowError"));
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
			queryClient.invalidateQueries({ queryKey: schedulesQueryKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesQueryKeys.awaitingConfirmation(),
			});
			queryClient.invalidateQueries({
				queryKey: schedulesQueryKeys.detail(variables),
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
		mutationFn: async ({ id, data }: UpdateRecurringScheduleCommand) => {
			const payload: PatchV1SchedulesRecurringByIdBody = {
				effectiveDate: data.effectiveDate,
				type: data.type,
				scheduleItems: data.scheduleItems.map((item) => ({ ...item })),
			};
			const response = await apiClient.patchV1SchedulesRecurringById(id, payload);
			return response.data;
		},
		onSuccess: () => {
			toast.success(t("toast.recurringUpdateSuccess"));
			queryClient.invalidateQueries({ queryKey: schedulesQueryKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: schedulesQueryKeys.awaitingConfirmation(),
			});
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
