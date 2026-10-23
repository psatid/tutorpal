import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import { Schedule } from "@/models/schedule";
import { useFetchSchedules } from "./use-fetch-schedules";

const selectClassSchedules = (
	data: GetV1Schedules200Item[] | undefined,
): Schedule[] | undefined => data?.map(Schedule.fromListItem);

export const useClassSchedules = (classId: string | null) =>
	useFetchSchedules<Schedule[] | undefined>({
		filters: { classId },
		enabled: Boolean(classId),
		select: selectClassSchedules,
	});
