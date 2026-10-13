import { secondsToHours } from "../lib/teaching-time";

export const CAPACITY_RESERVING_SCHEDULE_STATUSES = [
	"SCHEDULED",
	"COMPLETED",
	"NO_SHOW",
] as const;

export type CapacityReservingScheduleStatus =
	(typeof CAPACITY_RESERVING_SCHEDULE_STATUSES)[number];

type ClassHourBalanceSeconds = {
	totalSeconds: bigint;
	scheduledSeconds?: bigint;
	completedSeconds?: bigint;
	noShowSeconds?: bigint;
	usedSeconds?: bigint;
};

export class ClassHourBalance {
	readonly totalSeconds: bigint;
	readonly scheduledSeconds: bigint;
	readonly completedSeconds: bigint;
	readonly noShowSeconds: bigint;
	readonly usedSeconds: bigint;
	private readonly capacityReservedSeconds: bigint;

	private constructor(
		seconds: Required<ClassHourBalanceSeconds>,
		capacityReservedSeconds: bigint,
	) {
		this.totalSeconds = seconds.totalSeconds;
		this.scheduledSeconds = seconds.scheduledSeconds;
		this.completedSeconds = seconds.completedSeconds;
		this.noShowSeconds = seconds.noShowSeconds;
		this.usedSeconds = seconds.usedSeconds;
		this.capacityReservedSeconds = capacityReservedSeconds;
	}

	static fromSeconds(seconds: ClassHourBalanceSeconds): ClassHourBalance {
		const normalizedSeconds = {
			totalSeconds: seconds.totalSeconds,
			scheduledSeconds: seconds.scheduledSeconds ?? 0n,
			completedSeconds: seconds.completedSeconds ?? 0n,
			noShowSeconds: seconds.noShowSeconds ?? 0n,
			usedSeconds: seconds.usedSeconds ?? 0n,
		};
		return new ClassHourBalance(
			normalizedSeconds,
			normalizedSeconds.scheduledSeconds +
				normalizedSeconds.completedSeconds +
				normalizedSeconds.noShowSeconds,
		);
	}

	static fromReservedSeconds(seconds: {
		totalSeconds: bigint;
		reservedSeconds: bigint;
		usedSeconds?: bigint;
	}): ClassHourBalance {
		return new ClassHourBalance(
			{
				totalSeconds: seconds.totalSeconds,
				scheduledSeconds: 0n,
				completedSeconds: 0n,
				noShowSeconds: 0n,
				usedSeconds: seconds.usedSeconds ?? 0n,
			},
			seconds.reservedSeconds,
		);
	}

	get reservedSeconds(): bigint {
		return this.capacityReservedSeconds;
	}

	get remainingSeconds(): bigint {
		return this.totalSeconds - this.reservedSeconds;
	}

	get totalHours(): number {
		return secondsToHours(this.totalSeconds);
	}

	get remainingHours(): number {
		return secondsToHours(this.remainingSeconds);
	}

	get scheduledHours(): number {
		return secondsToHours(this.scheduledSeconds);
	}

	get usedHours(): number {
		return secondsToHours(this.usedSeconds);
	}

	canReserve(seconds: bigint): boolean {
		return this.remainingSeconds >= seconds;
	}
}

export function isCapacityReservingScheduleStatus(
	status: string,
): status is CapacityReservingScheduleStatus {
	return (CAPACITY_RESERVING_SCHEDULE_STATUSES as readonly string[]).includes(
		status,
	);
}
