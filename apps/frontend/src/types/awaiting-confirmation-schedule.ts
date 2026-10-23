export type AwaitingConfirmationSchedule = {
	id: string;
	className: string;
	date: string;
	time: number;
	durationMinutes: number;
};

export type AwaitingConfirmationSchedulePage = {
	schedules: AwaitingConfirmationSchedule[];
	pagination: {
		hasNext: boolean;
		nextCursor: string | null;
	};
};
