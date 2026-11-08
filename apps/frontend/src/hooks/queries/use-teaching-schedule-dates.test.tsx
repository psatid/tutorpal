import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import { schedulesQueryKeys } from "@/constants/query-keys/schedules-query-keys";

const api = vi.hoisted(() => ({
  fetchSchedules: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    getV1Schedules: api.fetchSchedules,
  },
}));

import { useTeachingScheduleDates } from "./use-teaching-schedule-dates";

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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useTeachingScheduleDates", () => {
  beforeEach(() => {
    api.fetchSchedules.mockReset();
  });

  it("deduplicates eligible scheduled and completed dates from an unfiltered range query", async () => {
    api.fetchSchedules.mockResolvedValue({
      data: [
        makeSchedule(),
        makeSchedule({ id: "complete", date: "2026-10-13", status: "COMPLETED" }),
        makeSchedule({ id: "duplicate", date: "2026-10-12" }),
        makeSchedule({ id: "cancelled", date: "2026-10-14", status: "CANCELLED" }),
        makeSchedule({ id: "no-show", date: "2026-10-15", status: "NO_SHOW" }),
      ],
    });
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () =>
        useTeachingScheduleDates([
          { startDate: "2026-10-12", endDate: "2026-10-18" },
        ]),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current).toEqual(new Set(["2026-10-12", "2026-10-13"]));
    });
    expect(api.fetchSchedules).toHaveBeenCalledWith({
      startDate: "2026-10-12",
      endDate: "2026-10-18",
    });

    await queryClient.invalidateQueries({ queryKey: schedulesQueryKeys.lists() });
    await waitFor(() => expect(api.fetchSchedules).toHaveBeenCalledTimes(2));
  });

  it("merges overlapping ranges and queries a six-week calendar grid in chunks of at most 28 days", async () => {
    api.fetchSchedules.mockResolvedValue({ data: [] });
    const queryClient = createQueryClient();
    renderHook(
      () =>
        useTeachingScheduleDates([
          { startDate: "2026-09-28", endDate: "2026-11-08" },
          { startDate: "2026-10-05", endDate: "2026-10-18" },
        ]),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(api.fetchSchedules).toHaveBeenCalledTimes(2));
    expect(api.fetchSchedules).toHaveBeenNthCalledWith(1, {
      startDate: "2026-09-28",
      endDate: "2026-10-25",
    });
    expect(api.fetchSchedules).toHaveBeenNthCalledWith(2, {
      startDate: "2026-10-26",
      endDate: "2026-11-08",
    });
  });
});
