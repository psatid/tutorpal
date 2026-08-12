import type { Prisma, PrismaClient, ScheduleStatus } from "@prisma/client";

function toHoursNumber(value: Prisma.Decimal | number): number {
	return typeof value === "number" ? value : value.toNumber();
}

export const ACTIVE_SCHEDULE_STATUSES: ScheduleStatus[] = [
	"SCHEDULED",
	"COMPLETED",
	"NO_SHOW",
];

export async function getRemainingHoursMap(
	client: PrismaClient,
	classIds: string[],
): Promise<Map<string, number>> {
	if (classIds.length === 0) {
		return new Map();
	}

	const uniqueClassIds = [...new Set(classIds)];

	const [classes, reservedMinutesByClass] = await Promise.all([
		client.class.findMany({
			where: {
				id: { in: uniqueClassIds },
			},
			select: {
				id: true,
				totalHours: true,
			},
		}),
		client.schedule.groupBy({
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
			toHoursNumber(classData.totalHours) -
				(reservedMinutesMap.get(classData.id) ?? 0) / 60,
		]),
	);
}

export async function getRemainingHoursForClass(
	client: PrismaClient,
	classId: string,
): Promise<number> {
	const remainingHoursMap = await getRemainingHoursMap(client, [classId]);
	const remainingHours = remainingHoursMap.get(classId);

	if (remainingHours === undefined) {
		throw new Error("Class not found");
	}

	return remainingHours;
}
