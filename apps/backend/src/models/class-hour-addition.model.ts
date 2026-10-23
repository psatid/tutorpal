import { MAX_CLASS_HOURS, MAX_CLASS_SECONDS } from "../lib/class-hour-addition";
import { DateTime } from "../lib/date-time";
import {
	hasAtMostTwoDecimalPlaces,
	MAX_CURRENCY_AMOUNT,
	normalizeCurrencyAmount,
} from "../lib/money";
import { hoursToSeconds, secondsToHours } from "../lib/teaching-time";
import type {
	ClassHourAdditionDTO,
	ClassHourAdditionSource,
	CreateClassHourAdditionDTO,
} from "../types/class.types";

type DecimalLike = { toNumber(): number };

export type ClassHourAdditionPrismaRecord = {
	id: string;
	classId: string;
	source: "COURSE" | "CUSTOM";
	secondsAdded: bigint;
	revenueAmount: DecimalLike | number | null;
	sourceCourseId: string | null;
	sourceCourseName: string | null;
	requestId: string;
	createdAt: Date;
};

export type ClassHourAdditionCourseSnapshot = {
	id: string;
	name: string;
	defaultTotalSeconds: bigint;
};

export type ClassHourAdditionDraft = Readonly<{
	request: ClassHourAdditionRequest;
	source: ClassHourAdditionSource;
	secondsAdded: bigint;
	revenueAmount: number | null;
	sourceCourseId: string | null;
	sourceCourseName: string | null;
	requestId: string;
}>;

export type ClassHourAdditionValidationReason =
	| "hours"
	| "revenue"
	| "course_hours";

export class ClassHourAdditionValidationError extends Error {
	constructor(
		readonly reason: ClassHourAdditionValidationReason,
		message: string,
	) {
		super(message);
		this.name = "ClassHourAdditionValidationError";
	}
}

export class ClassHourAdditionLimitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ClassHourAdditionLimitError";
	}
}

export class ClassHourAdditionRequestConflictError extends Error {
	constructor() {
		super("This request ID was already used for a different hour addition");
		this.name = "ClassHourAdditionRequestConflictError";
	}
}

function assertHoursFitAdditionLimit(seconds: bigint): bigint {
	if (seconds > MAX_CLASS_SECONDS) {
		throw new ClassHourAdditionLimitError(
			`Hours must not exceed ${MAX_CLASS_HOURS.toFixed(2)}`,
		);
	}
	return seconds;
}

function normalizeCustomHoursToSeconds(hours: number): bigint {
	if (
		!Number.isFinite(hours) ||
		hours <= 0 ||
		!hasAtMostTwoDecimalPlaces(hours)
	) {
		throw new ClassHourAdditionValidationError(
			"hours",
			"Hours must be a positive value with at most two decimal places",
		);
	}

	const seconds = hoursToSeconds(hours);
	if (seconds <= 0n) {
		throw new ClassHourAdditionValidationError(
			"hours",
			"Hours must be at least 0.01",
		);
	}
	return assertHoursFitAdditionLimit(seconds);
}

function normalizeRevenueAmount(
	revenueAmount: number | null | undefined,
): number | null {
	if (revenueAmount === null || revenueAmount === undefined) return null;

	if (
		!Number.isFinite(revenueAmount) ||
		revenueAmount < 0 ||
		revenueAmount > MAX_CURRENCY_AMOUNT ||
		!hasAtMostTwoDecimalPlaces(revenueAmount)
	) {
		throw new ClassHourAdditionValidationError(
			"revenue",
			"Revenue amount must be a non-negative value with at most two decimal places",
		);
	}

	return normalizeCurrencyAmount(revenueAmount);
}

export class ClassHourAdditionRequest {
	readonly source: ClassHourAdditionSource;
	readonly requestId: string;
	readonly revenueAmount: number | null;
	readonly courseId: string | null;
	readonly customSeconds: bigint | null;

	private constructor(props: {
		source: ClassHourAdditionSource;
		requestId: string;
		revenueAmount: number | null;
		courseId: string | null;
		customSeconds: bigint | null;
	}) {
		this.source = props.source;
		this.requestId = props.requestId;
		this.revenueAmount = props.revenueAmount;
		this.courseId = props.courseId;
		this.customSeconds = props.customSeconds;
		Object.freeze(this);
	}

	static normalize(data: CreateClassHourAdditionDTO): ClassHourAdditionRequest {
		const revenueAmount = normalizeRevenueAmount(data.revenueAmount);
		if (data.source === "course") {
			return new ClassHourAdditionRequest({
				source: "course",
				requestId: data.requestId,
				revenueAmount,
				courseId: data.courseId,
				customSeconds: null,
			});
		}

		return new ClassHourAdditionRequest({
			source: "custom",
			requestId: data.requestId,
			revenueAmount,
			courseId: null,
			customSeconds: normalizeCustomHoursToSeconds(data.hours),
		});
	}

	toDraft(course?: ClassHourAdditionCourseSnapshot): ClassHourAdditionDraft {
		if (this.source === "custom") {
			if (this.customSeconds === null) {
				throw new Error("Custom hour addition request is missing seconds");
			}
			return Object.freeze({
				request: this,
				source: "custom",
				secondsAdded: this.customSeconds,
				revenueAmount: this.revenueAmount,
				sourceCourseId: null,
				sourceCourseName: null,
				requestId: this.requestId,
			});
		}

		if (!course || course.id !== this.courseId) {
			throw new Error("Course snapshot is required for a course hour addition");
		}
		if (course.defaultTotalSeconds <= 0n) {
			throw new ClassHourAdditionValidationError(
				"course_hours",
				"Course hours must be greater than 0",
			);
		}

		return Object.freeze({
			request: this,
			source: "course",
			secondsAdded: assertHoursFitAdditionLimit(course.defaultTotalSeconds),
			revenueAmount: this.revenueAmount,
			sourceCourseId: course.id,
			sourceCourseName: course.name,
			requestId: this.requestId,
		});
	}

	matches(addition: ClassHourAdditionModel): boolean {
		if (addition.revenueAmount !== this.revenueAmount) {
			return false;
		}

		if (this.source === "course") {
			return (
				addition.source === "course" &&
				addition.sourceCourseId === this.courseId
			);
		}

		return (
			addition.source === "custom" &&
			addition.secondsAdded === this.customSeconds
		);
	}

	assertMatches(addition: ClassHourAdditionModel): void {
		if (!this.matches(addition)) {
			throw new ClassHourAdditionRequestConflictError();
		}
	}
}

export class ClassHourAdditionModel {
	readonly id: string;
	readonly classId: string;
	readonly source: ClassHourAdditionSource;
	readonly secondsAdded: bigint;
	readonly hours: number;
	readonly revenueAmount: number | null;
	readonly sourceCourseId: string | null;
	readonly sourceCourseName: string | null;
	readonly requestId: string;
	readonly createdAt: Date;

	constructor(props: {
		id: string;
		classId: string;
		source: ClassHourAdditionSource;
		secondsAdded: bigint;
		revenueAmount: number | null;
		sourceCourseId: string | null;
		sourceCourseName: string | null;
		requestId: string;
		createdAt: Date;
	}) {
		this.id = props.id;
		this.classId = props.classId;
		this.source = props.source;
		this.secondsAdded = props.secondsAdded;
		this.hours = secondsToHours(props.secondsAdded);
		this.revenueAmount = props.revenueAmount;
		this.sourceCourseId = props.sourceCourseId;
		this.sourceCourseName = props.sourceCourseName;
		this.requestId = props.requestId;
		this.createdAt = props.createdAt;
	}

	static prepare(data: CreateClassHourAdditionDTO): ClassHourAdditionRequest {
		return ClassHourAdditionRequest.normalize(data);
	}

	static fromPrisma(
		addition: ClassHourAdditionPrismaRecord,
	): ClassHourAdditionModel {
		return new ClassHourAdditionModel({
			id: addition.id,
			classId: addition.classId,
			source: addition.source === "COURSE" ? "course" : "custom",
			secondsAdded: addition.secondsAdded,
			revenueAmount:
				addition.revenueAmount === null
					? null
					: typeof addition.revenueAmount === "number"
						? addition.revenueAmount
						: addition.revenueAmount.toNumber(),
			sourceCourseId: addition.sourceCourseId,
			sourceCourseName: addition.sourceCourseName,
			requestId: addition.requestId,
			createdAt: addition.createdAt,
		});
	}

	toClassHourAdditionDTO(): ClassHourAdditionDTO {
		return {
			id: this.id,
			classId: this.classId,
			source: this.source,
			hours: this.hours,
			revenueAmount: this.revenueAmount,
			sourceCourseId: this.sourceCourseId,
			sourceCourseName: this.sourceCourseName,
			requestId: this.requestId,
			createdAt: DateTime.from(this.createdAt).toISOString(),
		};
	}
}
