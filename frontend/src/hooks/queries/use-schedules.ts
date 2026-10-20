import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import { Schedule } from "@/models/schedule";
import type { ScheduleListFilters } from "@/types/schedule-query";
import { useFetchSchedules } from "./use-fetch-schedules";

const selectSchedules = (
	data: GetV1Schedules200Item[] | undefined,
): Schedule[] | undefined => data?.map(Schedule.fromListItem);

export const useSchedules = (filters?: ScheduleListFilters) =>
	useFetchSchedules<Schedule[] | undefined>({
		filters,
		select: selectSchedules,
	});
