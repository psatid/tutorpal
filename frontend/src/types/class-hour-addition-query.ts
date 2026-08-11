import type { ClassHourAddition } from "@/models/class-hour-addition";

export type ClassHourAdditionListFilters = {
	page?: number;
	limit?: number;
};

export type ClassHourAdditionList = {
	additions: ClassHourAddition[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
};
