import type { GetV1SchedulesById200 } from "@/api/generated/models/getV1SchedulesById200";
import { Schedule } from "@/models/schedule";
import { useFetchScheduleById } from "./use-fetch-schedule-by-id";

const selectSchedule = (data: GetV1SchedulesById200 | undefined) =>
	data ? Schedule.fromGetScheduleByIdResponse(data) : undefined;

export const useGetSchedule = (scheduleId: string | null) =>
	useFetchScheduleById({ scheduleId, select: selectSchedule });
