import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
	fetchAwaitingConfirmation: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
	apiClient: {
		getV1SchedulesAwaitingConfirmation: api.fetchAwaitingConfirmation,
	},
}));

import { useInfiniteAwaitingConfirmationSchedules } from "@/hooks/queries/use-infinite-awaiting-confirmation-schedules";

function makePage({
	id,
	hasNext,
	nextCursor,
}: {
	id: string;
	hasNext: boolean;
	nextCursor: string | null;
}) {
	return {
		data: [
			{
				classId: "class-1",
				className: `Class ${id}`,
				createdAt: "2026-10-01T00:00:00.000Z",
				date: "2026-10-12",
				durationMinutes: 60,
				id,
				noShowNote: null,
				notes: null,
				status: "SCHEDULED",
				time: 540,
				type: "ONLINE",
				updatedAt: "2026-10-01T00:00:00.000Z",
			},
		],
		pagination: { hasNext, nextCursor },
	};
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

describe("useInfiniteAwaitingConfirmationSchedules", () => {
	beforeEach(() => {
		api.fetchAwaitingConfirmation.mockReset();
	});

	it("fetches the first page, maps UI fields, and follows the opaque cursor once", async () => {
		api.fetchAwaitingConfirmation
			.mockResolvedValueOnce({
				data: makePage({
					hasNext: true,
					id: "schedule-1",
					nextCursor: "cursor-2",
				}),
			})
			.mockResolvedValueOnce({
				data: makePage({
					hasNext: false,
					id: "schedule-2",
					nextCursor: null,
				}),
			});
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const { result } = renderHook(
			() => useInfiniteAwaitingConfirmationSchedules(),
			{ wrapper: createWrapper(queryClient) },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(api.fetchAwaitingConfirmation).toHaveBeenCalledWith({
			cursor: undefined,
			limit: 10,
		});
		expect(result.current.data?.pages[0]).toEqual({
			pagination: { hasNext: true, nextCursor: "cursor-2" },
			schedules: [
				{
					className: "Class schedule-1",
					date: "2026-10-12",
					durationMinutes: 60,
					id: "schedule-1",
					time: 540,
				},
			],
		});

		await act(async () => {
			await result.current.fetchNextPage();
		});

		await waitFor(() =>
			expect(api.fetchAwaitingConfirmation).toHaveBeenCalledTimes(2),
		);
		expect(api.fetchAwaitingConfirmation).toHaveBeenLastCalledWith({
			cursor: "cursor-2",
			limit: 10,
		});
		expect(result.current.data?.pages).toHaveLength(2);
		expect(result.current.hasNextPage).toBe(false);

		await act(async () => {
			await result.current.fetchNextPage();
		});

		expect(api.fetchAwaitingConfirmation).toHaveBeenCalledTimes(2);
	});
});
