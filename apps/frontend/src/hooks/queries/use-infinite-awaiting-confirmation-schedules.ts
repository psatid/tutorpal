import type { InfiniteData } from "@tanstack/react-query";
import type { GetV1SchedulesAwaitingConfirmation200 } from "@/api/generated/models/getV1SchedulesAwaitingConfirmation200";
import {
	Schedule,
	type AwaitingConfirmationSchedulePage,
} from "@/models/schedule";
import { useFetchInfiniteAwaitingConfirmationSchedules } from "./use-fetch-infinite-awaiting-confirmation-schedules";

type InfiniteAwaitingConfirmationScheduleList = InfiniteData<
	AwaitingConfirmationSchedulePage
>;

const selectAwaitingConfirmationSchedules = (
	data: InfiniteData<GetV1SchedulesAwaitingConfirmation200> | undefined,
): InfiniteAwaitingConfirmationScheduleList => ({
	pages:
		data?.pages.map((page) => ({
			schedules: page.data.map(Schedule.fromAwaitingConfirmationListItem),
			pagination: page.pagination,
		})) ?? [],
	pageParams: data?.pageParams ?? [],
});

export function useInfiniteAwaitingConfirmationSchedules() {
	return useFetchInfiniteAwaitingConfirmationSchedules<InfiniteAwaitingConfirmationScheduleList>(
		{ select: selectAwaitingConfirmationSchedules },
	);
}
