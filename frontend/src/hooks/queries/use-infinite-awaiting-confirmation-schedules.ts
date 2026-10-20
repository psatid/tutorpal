import type { InfiniteData } from "@tanstack/react-query";
import type { GetV1SchedulesAwaitingConfirmation200 } from "@/api/generated/models/getV1SchedulesAwaitingConfirmation200";
import type { GetV1SchedulesAwaitingConfirmation200DataItem } from "@/api/generated/models/getV1SchedulesAwaitingConfirmation200DataItem";
import type {
	AwaitingConfirmationSchedule,
	AwaitingConfirmationSchedulePage,
} from "@/types/awaiting-confirmation-schedule";
import { useFetchInfiniteAwaitingConfirmationSchedules } from "./use-fetch-infinite-awaiting-confirmation-schedules";

type InfiniteAwaitingConfirmationScheduleList = InfiniteData<
	AwaitingConfirmationSchedulePage
>;

function toAwaitingConfirmationSchedule(
	schedule: GetV1SchedulesAwaitingConfirmation200DataItem,
): AwaitingConfirmationSchedule {
	return {
		id: schedule.id,
		className: schedule.className,
		date: schedule.date,
		time: schedule.time,
		durationMinutes: schedule.durationMinutes,
	};
}

const selectAwaitingConfirmationSchedules = (
	data: InfiniteData<GetV1SchedulesAwaitingConfirmation200> | undefined,
): InfiniteAwaitingConfirmationScheduleList => ({
	pages:
		data?.pages.map((page) => ({
			schedules: page.data.map(toAwaitingConfirmationSchedule),
			pagination: page.pagination,
		})) ?? [],
	pageParams: data?.pageParams ?? [],
});

export function useInfiniteAwaitingConfirmationSchedules() {
	return useFetchInfiniteAwaitingConfirmationSchedules<InfiniteAwaitingConfirmationScheduleList>(
		{ select: selectAwaitingConfirmationSchedules },
	);
}
