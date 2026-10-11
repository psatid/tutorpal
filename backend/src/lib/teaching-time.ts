const SECONDS_PER_MINUTE = 60n;
const SECONDS_PER_HOUR = 3_600n;
const SECONDS_PER_HUNDREDTH_HOUR = 36n;
const MAX_SIGNED_INT64 = (1n << 63n) - 1n;
const MIN_SIGNED_INT64 = -(1n << 63n);
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_INTEGER_BIGINT = BigInt(Number.MIN_SAFE_INTEGER);

function assertSignedInt64(seconds: bigint): bigint {
	if (seconds < MIN_SIGNED_INT64 || seconds > MAX_SIGNED_INT64) {
		throw new RangeError("Teaching time must fit in a signed 64-bit integer");
	}
	return seconds;
}

function toSafeNumber(value: bigint, label: string): number {
	if (value < MIN_SAFE_INTEGER_BIGINT || value > MAX_SAFE_INTEGER_BIGINT) {
		throw new RangeError(`${label} cannot be represented safely as a number`);
	}
	return Number(value);
}

function hasAtMostTwoDecimalPlaces(value: number): boolean {
	const scaled = value * 100;
	return (
		Math.abs(scaled - Math.round(scaled)) <=
		Number.EPSILON * Math.max(1, Math.abs(scaled)) * 4
	);
}

export function hoursToSeconds(hours: number): bigint {
	if (!Number.isFinite(hours) || !hasAtMostTwoDecimalPlaces(hours)) {
		throw new RangeError(
			"Hours must be a finite value with at most two decimal places",
		);
	}

	const hundredthsOfAnHour = Math.round(hours * 100);
	if (!Number.isSafeInteger(hundredthsOfAnHour)) {
		throw new RangeError("Hours cannot be represented safely as seconds");
	}

	return assertSignedInt64(
		BigInt(hundredthsOfAnHour) * SECONDS_PER_HUNDREDTH_HOUR,
	);
}

export function minutesToSeconds(minutes: number): bigint {
	if (!Number.isSafeInteger(minutes)) {
		throw new RangeError("Minutes must be a safe integer");
	}

	return assertSignedInt64(BigInt(minutes) * SECONDS_PER_MINUTE);
}

export function secondsToHours(seconds: bigint): number {
	return (
		toSafeNumber(assertSignedInt64(seconds), "Seconds") /
		Number(SECONDS_PER_HOUR)
	);
}

export function secondsToMinutes(seconds: bigint): number {
	assertSignedInt64(seconds);
	if (seconds % SECONDS_PER_MINUTE !== 0n) {
		throw new RangeError("Schedule durations must be stored as whole minutes");
	}
	return toSafeNumber(seconds / SECONDS_PER_MINUTE, "Minutes");
}

export function secondsToMilliseconds(seconds: bigint): number {
	return toSafeNumber(assertSignedInt64(seconds) * 1_000n, "Milliseconds");
}
