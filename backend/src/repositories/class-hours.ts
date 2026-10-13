import type { PrismaClient } from "@prisma/client";
import { secondsToHours } from "../lib/teaching-time";
import { CAPACITY_RESERVING_SCHEDULE_STATUSES } from "../models/schedule.model";

export const ACTIVE_SCHEDULE_STATUSES = CAPACITY_RESERVING_SCHEDULE_STATUSES;

type ClassHours = {
	id: string;
	totalSeconds: bigint;
};

type ClassHourAccountingReader = Pick<
	PrismaClient,
	"schedule" | "classHourDeduction"
>;

export type ClassHourAccounting = {
	remainingHours: number;
	scheduledHours: number;
	usedHours: number;
};

export async function getClassHourAccountingMap(
	client: ClassHourAccountingReader,
	classes: ClassHours[],
): Promise<Map<string, ClassHourAccounting>> {
	if (classes.length === 0) {
		return new Map();
	}

	const uniqueClasses = new Map(
		classes.map((classData) => [classData.id, classData.totalSeconds]),
	);
	const classIds = [...uniqueClasses.keys()];
	const [scheduleSecondsByClass, usedSecondsByClass] = await Promise.all([
		client.schedule.groupBy({
			by: ["classId", "status"],
			where: {
				classId: { in: classIds },
				status: { in: ACTIVE_SCHEDULE_STATUSES },
			},
			_sum: {
				durationSeconds: true,
			},
		}),
		client.classHourDeduction.groupBy({
			by: ["classId"],
			where: {
				classId: { in: classIds },
				restoredAt: null,
			},
			_sum: {
				secondsDeducted: true,
			},
		}),
	]);

	const reservedSecondsByClass = new Map<string, bigint>();
	const scheduledSecondsByClass = new Map<string, bigint>();
	for (const schedule of scheduleSecondsByClass) {
		const seconds = schedule._sum.durationSeconds ?? 0n;
		reservedSecondsByClass.set(
			schedule.classId,
			(reservedSecondsByClass.get(schedule.classId) ?? 0n) + seconds,
		);
		if (schedule.status === "SCHEDULED") {
			scheduledSecondsByClass.set(schedule.classId, seconds);
		}
	}

	const usedSecondsMap = new Map(
		usedSecondsByClass.map((item) => [
			item.classId,
			item._sum.secondsDeducted ?? 0n,
		]),
	);

	return new Map(
		[...uniqueClasses].map(([classId, totalSeconds]) => [
			classId,
			{
				remainingHours: secondsToHours(
					totalSeconds - (reservedSecondsByClass.get(classId) ?? 0n),
				),
				scheduledHours: secondsToHours(
					scheduledSecondsByClass.get(classId) ?? 0n,
				),
				usedHours: secondsToHours(usedSecondsMap.get(classId) ?? 0n),
			},
		]),
	);
}

export async function getRemainingSecondsMap(
	client: Pick<PrismaClient, "class" | "schedule">,
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
	client: Pick<PrismaClient, "class" | "schedule">,
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
	client: Pick<PrismaClient, "class" | "schedule">,
	classId: string,
): Promise<number> {
	return secondsToHours(await getRemainingSecondsForClass(client, classId));
}
