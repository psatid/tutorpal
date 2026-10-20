import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { schedulesKeys } from "@/hooks/queries/query-keys";
import i18n from "@/lib/i18n/config";

const api = vi.hoisted(() => ({
	complete: vi.fn(),
	noShow: vi.fn(),
}));

const toast = vi.hoisted(() => ({
	error: vi.fn(),
	success: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
	apiClient: {
		patchV1SchedulesByIdComplete: api.complete,
		patchV1SchedulesByIdNoShow: api.noShow,
	},
}));

vi.mock("sonner", () => ({ toast }));

import {
	useCompleteSchedule,
	useNoShowSchedule,
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
		api.noShow.mockReset();
		toast.error.mockReset();
		toast.success.mockReset();
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
