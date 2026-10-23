import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { schedulesKeys } from "@/hooks/queries/query-keys";
import i18n from "@/lib/i18n/config";
import type { UpdateRecurringScheduleCommand } from "@/models/recurring-schedule";
import type {
	ScheduleCreateCommand,
	ScheduleUpdateCommand,
} from "@/models/schedule";

const api = vi.hoisted(() => ({
	complete: vi.fn(),
	create: vi.fn(),
	noShow: vi.fn(),
	update: vi.fn(),
	updateRecurring: vi.fn(),
}));

const toast = vi.hoisted(() => ({
	error: vi.fn(),
	success: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
	apiClient: {
		patchV1SchedulesByIdComplete: api.complete,
		patchV1SchedulesByIdNoShow: api.noShow,
		patchV1SchedulesRecurringById: api.updateRecurring,
		postV1Schedules: api.create,
		putV1SchedulesById: api.update,
	},
}));

vi.mock("sonner", () => ({ toast }));

import {
	useCompleteSchedule,
	useCreateSchedule,
	useNoShowSchedule,
	useUpdateRecurringSchedule,
	useUpdateSchedule,
} from "@/hooks/mutations/use-schedules";

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
			queries: { retry: false },
		},
	});
}

function createWrapper(queryClient: QueryClient) {
	return function QueryClientWrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		);
	};
}

function expectConfirmationFeedInvalidated(
	invalidateQueries: ReturnType<typeof vi.spyOn>,
) {
	expect(invalidateQueries).toHaveBeenCalledWith({
		queryKey: schedulesKeys.awaitingConfirmation(),
	});
}

describe("schedule confirmation mutations", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
		api.complete.mockReset();
		api.create.mockReset();
		api.noShow.mockReset();
		api.update.mockReset();
		api.updateRecurring.mockReset();
		toast.error.mockReset();
		toast.success.mockReset();
	});

	it("preserves one-time and recurring create payloads", async () => {
		api.create.mockResolvedValue({ data: {} });
		const queryClient = createQueryClient();
		const { result } = renderHook(() => useCreateSchedule(), {
			wrapper: createWrapper(queryClient),
		});
		const oneTime: ScheduleCreateCommand = {
			classId: "class-1",
			date: "2026-10-12",
			durationMinutes: 90,
			notes: "Bring workbook",
			time: 13 * 60,
			type: "ONLINE",
		};
		const recurring: ScheduleCreateCommand = {
			classId: "class-1",
			date: "2026-10-12",
			time: 0,
			type: "ON_SITE",
			recurring: {
				startDate: "2026-10-19",
				scheduleItems: [
					{ weekday: "MONDAY", time: 9 * 60, durationMinutes: 60 },
				],
			},
		};

		await act(async () => {
			await result.current.mutateAsync(oneTime);
			await result.current.mutateAsync(recurring);
		});

		expect(api.create).toHaveBeenNthCalledWith(1, oneTime);
		expect(api.create).toHaveBeenNthCalledWith(2, {
			classId: "class-1",
			date: "2026-10-19",
			durationMinutes: undefined,
			notes: undefined,
			recurring: recurring.recurring,
			time: 0,
			type: "ON_SITE",
		});
	});

	it("preserves update and recurring-series request payloads", async () => {
		api.update.mockResolvedValue({ data: {} });
		api.updateRecurring.mockResolvedValue({ data: {} });
		const queryClient = createQueryClient();
		const { result: updateResult } = renderHook(() => useUpdateSchedule(), {
			wrapper: createWrapper(queryClient),
		});
		const { result: updateRecurringResult } = renderHook(
			() => useUpdateRecurringSchedule(),
			{ wrapper: createWrapper(queryClient) },
		);
		const update: ScheduleUpdateCommand = {
			classId: "class-1",
			date: "2026-10-12",
			durationMinutes: 60,
			notes: "Updated note",
			time: 9 * 60,
			type: "ONLINE",
		};
		const recurringUpdate: UpdateRecurringScheduleCommand = {
			data: {
				effectiveDate: "2026-10-19",
				scheduleItems: [
					{ weekday: "MONDAY", time: 9 * 60, durationMinutes: 60 },
				],
				type: "ON_SITE",
			},
			id: "recurring-1",
		};

		await act(async () => {
			await updateResult.current.mutateAsync({ id: "schedule-1", data: update });
			await updateRecurringResult.current.mutateAsync(recurringUpdate);
		});

		expect(api.update).toHaveBeenCalledWith("schedule-1", update);
		expect(api.updateRecurring).toHaveBeenCalledWith(
			"recurring-1",
			recurringUpdate.data,
		);
	});

	it("invalidates the confirmation feed after a successful completion", async () => {
		api.complete.mockResolvedValue({ data: {} });
		const onSuccess = vi.fn();
		const queryClient = createQueryClient();
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useCompleteSchedule({ onSuccess }), {
			wrapper: createWrapper(queryClient),
		});

		await act(async () => {
			await result.current.mutateAsync("schedule-1");
		});

		expect(api.complete).toHaveBeenCalledWith("schedule-1");
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: schedulesKeys.lists(),
		});
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: schedulesKeys.detail("schedule-1"),
		});
		expectConfirmationFeedInvalidated(invalidateQueries);
		expect(toast.success).toHaveBeenCalledTimes(1);
		expect(onSuccess).toHaveBeenCalledTimes(1);
	});

	it("keeps the confirmation feed untouched and reports a completion failure", async () => {
		api.complete.mockRejectedValue(new Error("Complete request failed"));
		const queryClient = createQueryClient();
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useCompleteSchedule(), {
			wrapper: createWrapper(queryClient),
		});

		await act(async () => {
			await result.current.mutateAsync("schedule-1").catch(() => undefined);
		});

		expect(toast.error).toHaveBeenCalledWith("Complete request failed");
		expect(invalidateQueries).not.toHaveBeenCalled();
	});

	it("invalidates the confirmation feed after a successful no-show outcome", async () => {
		api.noShow.mockResolvedValue({ data: {} });
		const onSuccess = vi.fn();
		const queryClient = createQueryClient();
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useNoShowSchedule({ onSuccess }), {
			wrapper: createWrapper(queryClient),
		});

		await act(async () => {
			await result.current.mutateAsync({
				deductHours: true,
				id: "schedule-1",
				note: "Parent notified",
			});
		});

		expect(api.noShow).toHaveBeenCalledWith("schedule-1", {
			deductHours: true,
			note: "Parent notified",
		});
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: schedulesKeys.lists(),
		});
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: schedulesKeys.detail("schedule-1"),
		});
		expectConfirmationFeedInvalidated(invalidateQueries);
		expect(toast.success).toHaveBeenCalledTimes(1);
		expect(onSuccess).toHaveBeenCalledTimes(1);
	});

	it("keeps the confirmation feed untouched and reports a no-show failure", async () => {
		api.noShow.mockRejectedValue(new Error("No-show request failed"));
		const queryClient = createQueryClient();
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useNoShowSchedule(), {
			wrapper: createWrapper(queryClient),
		});

		await act(async () => {
			await result.current
				.mutateAsync({
					deductHours: false,
					id: "schedule-1",
				})
				.catch(() => undefined);
		});

		expect(toast.error).toHaveBeenCalledWith("No-show request failed");
		expect(invalidateQueries).not.toHaveBeenCalled();
	});
});
