import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import type { GetV1SchedulesById200 } from "@/api/generated/models/getV1SchedulesById200";
import { schedulesQueryKeys } from "@/constants/query-keys/schedules-query-keys";
import { Schedule } from "@/models/schedule";

const api = vi.hoisted(() => ({
	fetchSchedule: vi.fn(),
	fetchSchedules: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
	apiClient: {
		getV1Schedules: api.fetchSchedules,
		getV1SchedulesById: api.fetchSchedule,
	},
}));

import { useClassSchedules } from "@/hooks/queries/use-class-schedules";
import { useGetSchedule } from "@/hooks/queries/use-get-schedule";
import { useSchedules } from "@/hooks/queries/use-schedules";

function makeSchedule(
	overrides: Partial<GetV1Schedules200Item> = {},
): GetV1Schedules200Item {
	return {
		classId: "class-1",
		className: "Algebra",
		createdAt: "2026-10-01T00:00:00.000Z",
		date: "2026-10-12",
		durationMinutes: 60,
		id: "schedule-1",
		noShowNote: null,
		notes: null,
		recurringScheduleId: null,
		status: "SCHEDULED",
		time: 540,
		type: "ONLINE",
		updatedAt: "2026-10-01T00:00:00.000Z",
		...overrides,
	};
}

function createQueryClient() {
	return new QueryClient({
		defaultOptions: { queries: { retry: false } },
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

describe("schedule query model selectors", () => {
	beforeEach(() => {
		api.fetchSchedule.mockReset();
		api.fetchSchedules.mockReset();
	});

	it("keeps list responses raw in the cache while exposing Schedule instances", async () => {
		const filters = { date: "2026-10-12", search: "algebra" };
		const rawSchedules = [makeSchedule()];
		api.fetchSchedules.mockResolvedValue({ data: rawSchedules });
		const queryClient = createQueryClient();
		const { result } = renderHook(() => useSchedules(filters), {
			wrapper: createWrapper(queryClient),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(api.fetchSchedules).toHaveBeenCalledWith(filters);
		expect(result.current.data?.[0]).toBeInstanceOf(Schedule);
		expect(result.current.data?.[0]?.getClassName()).toBe("Algebra");
		const cached = queryClient.getQueryData<GetV1Schedules200Item[]>(
			schedulesQueryKeys.list(filters),
		);
		expect(cached).toEqual(rawSchedules);
		expect(cached?.[0]).not.toBeInstanceOf(Schedule);
	});

	it("selects a Schedule for detail observers while retaining the raw detail cache", async () => {
		const rawSchedule: GetV1SchedulesById200 = makeSchedule({
			id: "schedule-detail",
		});
		api.fetchSchedule.mockResolvedValue({ data: rawSchedule });
		const queryClient = createQueryClient();
		const { result } = renderHook(() => useGetSchedule("schedule-detail"), {
			wrapper: createWrapper(queryClient),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(api.fetchSchedule).toHaveBeenCalledWith("schedule-detail");
		expect(result.current.data).toBeInstanceOf(Schedule);
		expect(result.current.data?.getId()).toBe("schedule-detail");
		expect(
			queryClient.getQueryData<GetV1SchedulesById200>(
				schedulesQueryKeys.detail("schedule-detail"),
			),
		).toEqual(rawSchedule);
	});

	it("selects class schedules and does not request a list without a class id", async () => {
		const rawSchedules = [makeSchedule({ classId: "class-7" })];
		api.fetchSchedules.mockResolvedValue({ data: rawSchedules });
		const queryClient = createQueryClient();
		const { result } = renderHook(() => useClassSchedules("class-7"), {
			wrapper: createWrapper(queryClient),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(api.fetchSchedules).toHaveBeenCalledWith({ classId: "class-7" });
		expect(result.current.data?.[0]).toBeInstanceOf(Schedule);
		expect(
			queryClient.getQueryData<GetV1Schedules200Item[]>(
				schedulesQueryKeys.list({ classId: "class-7" }),
			),
		).toEqual(rawSchedules);

		api.fetchSchedules.mockReset();
		const disabledClient = createQueryClient();
		renderHook(() => useClassSchedules(null), {
			wrapper: createWrapper(disabledClient),
		});
		expect(api.fetchSchedules).not.toHaveBeenCalled();
	});

	it("preserves the established schedule query-key tuples", () => {
		const filters = { date: "2026-10-12", search: "algebra" };

		expect(schedulesQueryKeys.all).toEqual(["schedules"]);
		expect(schedulesQueryKeys.lists()).toEqual(["schedules", "list"]);
		expect(schedulesQueryKeys.list(filters)).toEqual([
			"schedules",
			"list",
			filters,
		]);
		expect(schedulesQueryKeys.infinites()).toEqual([
			"schedules",
			"infinite",
		]);
		expect(schedulesQueryKeys.awaitingConfirmation()).toEqual([
			"schedules",
			"infinite",
			"awaiting-confirmation",
		]);
		expect(schedulesQueryKeys.details()).toEqual(["schedules", "detail"]);
		expect(schedulesQueryKeys.detail("schedule-1")).toEqual([
			"schedules",
			"detail",
			"schedule-1",
		]);
		expect(schedulesQueryKeys.detail(null)).toEqual([
			"schedules",
			"detail",
			null,
		]);
	});
});
