import type { ScheduleStatus } from "@prisma/client";
import { prisma } from "../lib/db";

export const ACTIVE_SCHEDULE_STATUSES: ScheduleStatus[] = [
	"SCHEDULED",
	"COMPLETED",
];

export async function getRemainingHoursMap(
	classIds: string[],
): Promise<Map<string, number>> {
	if (classIds.length === 0) {
		return new Map();
	}

	const uniqueClassIds = [...new Set(classIds)];

	const [classes, reservedMinutesByClass] = await Promise.all([
		prisma.class.findMany({
			where: {
				id: { in: uniqueClassIds },
			},
			select: {
				id: true,
				totalHours: true,
			},
		}),
		prisma.schedule.groupBy({
			by: ["classId"],
			where: {
				classId: { in: uniqueClassIds },
				status: { in: ACTIVE_SCHEDULE_STATUSES },
			},
			_sum: {
				durationMinutes: true,
			},
		}),
	]);

	const reservedMinutesMap = new Map(
		reservedMinutesByClass.map((item) => [
			item.classId,
			item._sum.durationMinutes ?? 0,
		]),
	);

	return new Map(
		classes.map((classData) => [
			classData.id,
			classData.totalHours - (reservedMinutesMap.get(classData.id) ?? 0) / 60,
		]),
	);
}

export async function getRemainingHoursForClass(classId: string): Promise<number> {
	const remainingHoursMap = await getRemainingHoursMap([classId]);
	const remainingHours = remainingHoursMap.get(classId);

	if (remainingHours === undefined) {
		throw new Error("Class not found");
	}

	return remainingHours;
}
