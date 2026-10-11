import type { PrismaClient, ScheduleStatus } from "@prisma/client";
import { secondsToHours } from "../lib/teaching-time";

export const ACTIVE_SCHEDULE_STATUSES: ScheduleStatus[] = [
	"SCHEDULED",
	"COMPLETED",
	"NO_SHOW",
];

export async function getRemainingSecondsMap(
	client: PrismaClient,
	classIds: string[],
): Promise<Map<string, bigint>> {
	if (classIds.length === 0) {
		return new Map();
	}

	const uniqueClassIds = [...new Set(classIds)];

	const [classes, reservedSecondsByClass] = await Promise.all([
		client.class.findMany({
			where: {
				id: { in: uniqueClassIds },
			},
			select: {
				id: true,
				totalSeconds: true,
			},
		}),
		client.schedule.groupBy({
			by: ["classId"],
			where: {
				classId: { in: uniqueClassIds },
				status: { in: ACTIVE_SCHEDULE_STATUSES },
			},
			_sum: {
				durationSeconds: true,
			},
		}),
	]);

	const reservedSecondsMap = new Map(
		reservedSecondsByClass.map((item) => [
			item.classId,
			item._sum.durationSeconds ?? 0n,
		]),
	);

	return new Map(
		classes.map((classData) => [
			classData.id,
			classData.totalSeconds - (reservedSecondsMap.get(classData.id) ?? 0n),
		]),
	);
}

export async function getRemainingSecondsForClass(
	client: PrismaClient,
	classId: string,
): Promise<bigint> {
	const remainingSecondsMap = await getRemainingSecondsMap(client, [classId]);
	const remainingSeconds = remainingSecondsMap.get(classId);

	if (remainingSeconds === undefined) {
		throw new Error("Class not found");
	}

	return remainingSeconds;
}

export async function getRemainingHoursMap(
	client: PrismaClient,
	classIds: string[],
): Promise<Map<string, number>> {
	const remainingSecondsMap = await getRemainingSecondsMap(client, classIds);
	return new Map(
		[...remainingSecondsMap].map(([classId, seconds]) => [
			classId,
			secondsToHours(seconds),
		]),
	);
}

export async function getRemainingHoursForClass(
	client: PrismaClient,
	classId: string,
): Promise<number> {
	return secondsToHours(await getRemainingSecondsForClass(client, classId));
}
