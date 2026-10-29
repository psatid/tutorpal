export default {
	title: "Schedules",
	managingCount: "Managing {{count}} scheduled session this term.",
	managingCount_plural: "Managing {{count}} scheduled sessions this term.",
	searchPlaceholder: "Search by class...",
	loading: "Loading schedules...",
	error: {
		title: "Couldn't load schedules",
		description: "Please try again.",
		retry: "Try again",
	},
	duration: "{{minutes}} min",
	durationHours: "{{hours}} h",
	durationHoursMinutes: "{{hours}} h {{minutes}} min",
	validation: {
		classRequired: "Class is required.",
		dateRequired: "Date is required.",
		typeRequired: "Choose a schedule type.",
		durationRequired: "Duration must be at least 1 minute.",
		invalidTime: "Invalid time format.",
		weekdayRequired: "At least one weekday must be selected.",
		overlappingWeekdayTimes: "Recurring sessions cannot overlap.",
		timeRequired: "Time is required for one-time schedules.",
		effectiveDateRequired: "Effective date is required.",
	},
	toast: {
		createSuccess: "Schedule created successfully.",
		createError: "Failed to create schedule. Please try again.",
		updateSuccess: "Schedule updated successfully.",
		updateError: "Failed to update schedule. Please try again.",
		deleteSuccess: "Schedule deleted successfully.",
		deleteError: "Failed to delete schedule. Please try again.",
		completeSuccess: "Schedule completed successfully. Hours deducted.",
		completeError: "Failed to complete schedule. Please try again.",
		noShowDeductSuccess: "No show recorded. Hours remain reserved.",
		noShowReleaseSuccess: "Session cancelled and hours released.",
		noShowError: "Failed to record the no show. Please try again.",
		restoreSuccess: "Hours restored successfully.",
		restoreError: "Failed to restore hours. Please try again.",
		recurringUpdateSuccess: "Recurring schedule updated successfully.",
		recurringUpdateError:
			"Failed to update recurring schedule. Please try again.",
	},
	noSchedules: "No schedules yet",
	noSchedulesDescription: "Create your first schedule to get started.",
	weekNoSchedules: "No schedules this week",
	weekNoSchedulesDescription:
		"Create a schedule to see your week take shape here.",
	weekNoResults: "No matching schedules this week",
	noResults: "No schedules found",
	status: {
		SCHEDULED: "Scheduled",
		COMPLETED: "Completed",
		NO_SHOW: "No Show",
		CANCELLED: "Cancelled",
	},
	type: {
		ON_SITE: "On-site",
		ONLINE: "Online",
	},
	delete: {
		confirm: "Are you sure you want to delete this schedule?",
		confirmButton: "Delete",
		cancelButton: "Cancel",
	},
	complete: {
		action: "Complete",
		title: "Complete this schedule?",
		confirm_one:
			"This schedule will be marked as completed and {{hours}} hour will be deducted.",
		confirm_other:
			"This schedule will be marked as completed and {{hours}} hours will be deducted.",
		confirmButton: "Complete",
		cancelButton: "Cancel",
	},
	noShow: {
		action: "No Show",
		confirm: "Mark this schedule as no show? {{hours}} hours will remain reserved.",
		confirmButton: "Mark No Show",
		cancelButton: "Cancel",
		title: "Record no show",
		description:
			"Choose what to do with this session's reserved hours. You can add a separate no-show note.",
		session: {
			date: "Date",
			time: "Time",
			duration: "Duration",
			endDateTime: "Ends {{date}} at {{time}}",
			endDayOffset_one: "(+{{count}} day)",
			endDayOffset_other: "(+{{count}} days)",
		},
		outcome: {
			label: "What should happen to the reserved hours?",
			deduct: {
				title: "Keep hours reserved",
				description: "Mark as no show and deduct {{hours}} hours.",
			},
			release: {
				title: "Release the hours",
				description: "Cancel this session and release {{hours}} hours.",
			},
		},
		note: {
			label: "No-show note",
			caption: "Optional. This is separate from the schedule notes.",
			placeholder: "Add a note about the no-show...",
			displayLabel: "No-show note",
		},
		submitDeduct: "Mark no show and deduct {{hours}} h",
		submitRelease: "Cancel session and release {{hours}} h",
		submitChooseOutcome: "Choose an outcome",
	},
	restore: {
		action: "Restore",
		confirm: "Restore {{hours}} hours for this schedule?",
		confirmButton: "Restore",
		cancelButton: "Cancel",
	},
	recurring: {
		sectionTitle: "Recurring schedule",
		emptyDescription:
			"Set the weekly pattern for this class so future sessions stay in sync.",
		noAvailabilityDescription:
			"{{balance}}. Add hours before creating a recurring schedule.",
		addHoursAction: "Add hours",
		createAction: "Create recurring schedule",
		editAction: "Edit recurring schedule",
		saveAction: "Save changes",
		cancelAction: "Cancel",
		confirmAction: "Recreate future schedules",
		startsOn: "Starts {{date}}",
		editHint:
			"Editing creates a new future pattern from your effective date. Past schedules stay untouched.",
		untouchedTitle: "Past schedules stay untouched",
		untouchedDescription:
			"Only generated schedules on or after the selected date will be recreated.",
		startDateLabel: "Start date",
		startDateCaption:
			"The first date when this recurring schedule begins creating sessions.",
		effectiveDateLabel: "Effective date",
		effectiveDateCaption:
			"The first date when TutorPal should switch to the new recurring pattern.",
		previewTitle: "Before you save",
		previewDescription:
			"Starting {{date}}, {{count}} future generated sessions will be replaced.",
		confirmTitle: "Update recurring schedule?",
		confirmDescription:
			"Starting {{date}}, TutorPal will recreate {{count}} future generated sessions to follow the new pattern. Type: {{type}}. Past schedules will not change.",
		previewType: "Schedule type: {{type}}",
		typeNotSelected: "a schedule type",
		notSelected: "your selected date",
		drawer: {
			createTitle: "Create Recurring Schedule",
			editTitle: "Edit Recurring Schedule",
		},
	},
	view: "View",
	actionsFor: "Actions for {{name}}",
	remainingHours: "{{hours}}h remaining",
	drawer: {
		createTitle: "Add New Schedule",
		editTitle: "Edit Schedule",
		viewTitle: "Schedule Details",
		editButton: "Edit",
		updateButton: "Update Schedule",
		closeButton: "Close",
		cancelButton: "Cancel",
		actions: {
			label: "Schedule actions",
		},
		class: {
			label: "Class",
			placeholder: "Select a class",
		},
		date: {
			label: "Date",
			recurringLabel: "Start Date",
			recurringCaption: "First occurrence of this recurring schedule",
		},
		time: {
			label: "Time",
			placeholder: "Select time",
		},
		duration: {
			label: "Duration",
			placeholder: "Select duration",
		},
		notes: {
			label: "Notes",
			caption: "Optional",
			placeholder: "Add any notes...",
		},
		status: {
			label: "Status",
			placeholder: "Select status",
		},
		type: {
			label: "Schedule type",
			caption: "Choose where this session will take place.",
			error: "Choose a schedule type.",
		},
		recurring: {
			label: "Make this recurring",
			startDate: {
				label: "Start Date",
				caption: "First occurrence of this recurring schedule",
			},
		},
		weekdayTime: {
			label: "Schedule",
			caption: "Select weekdays, times, and durations for recurring sessions",
			selectAll: "Select All",
			clearAll: "Clear All",
			timeLabel: "Time — {{interval}}",
			durationLabel: "Duration (minutes) — {{interval}}",
			durationSelectLabel: "Duration — {{interval}}",
			durationPlaceholder: "e.g., 60",
			interval: "Session {{number}}",
			intervalLabel: "{{weekday}}, session {{number}}",
			add: "Add session",
			addInterval: "Add a session on {{weekday}}",
			remove: "Remove",
			removeInterval: "Remove session {{number}} on {{weekday}}",
			noMoreIntervals:
				"No later start time is available on {{weekday}}.",
			overlap: "Recurring sessions cannot overlap.",
			weekdays: {
				MONDAY: "Monday",
				TUESDAY: "Tuesday",
				WEDNESDAY: "Wednesday",
				THURSDAY: "Thursday",
				FRIDAY: "Friday",
				SATURDAY: "Saturday",
				SUNDAY: "Sunday",
			},
		},
	},
	addSchedule: "Add Schedule",
	description: "View and manage your tutoring calendar and upcoming sessions.",
	empty: "No schedules found. Create your first schedule to get started.",
	filter: {
		all: "All",
	},
	classSelector: {
		title: "Select Class",
		searchPlaceholder: "Search by class or student...",
		noClasses: "No classes yet",
		noResults: "No classes found",
		selected: "Selected",
		remainingHours: "{{hours}}h left",
	},
	classNoAvailability: {
		description:
			"{{balance}}. Add hours before scheduling a session.",
		addHours: "Add hours",
	},
	classAvailability: {
		loading: "Checking this class’s available hours…",
		loadError:
			"This class’s available hours couldn’t load. Try again before scheduling.",
	},
	weekSelector: {
		today: "Today",
		selected: "Selected",
		selectedWeek: "Selected week",
		containsToday: "Contains today",
		openCalendar: "Open calendar for {{month}}",
		openWeekCalendar: "Open calendar for {{week}}",
		dateRailLabel: "Schedule date selector",
		dateRailInstruction:
			"Scroll horizontally to browse dates without changing the selected date. Select a date with its button. Use the Left and Right Arrow keys or Page Up and Page Down to move focus without selecting. Press Enter or Space to select the focused date.",
		weekRailLabel: "Schedule week selector",
		weekRailInstruction:
			"Scroll horizontally to browse weeks without changing the selected week. Select a week with its button. Use the Left and Right Arrow keys or Page Up and Page Down to move focus without selecting. Press Enter or Space to select the focused week.",
		weekLabel: "Week of {{start}} through {{end}}",
	},
	viewMode: {
		label: "Schedule view",
		day: "Day",
		week: "Week",
	},
	timeline: {
		label: "Weekly schedule timeline",
		instruction:
			"Use the Arrow keys to move between 30-minute slots and days. Press Enter or Space to create a schedule.",
		previousWeek: "Previous week",
		nextWeek: "Next week",
		openCalendar: "Choose a date in {{week}}",
		createCellLabel: "Create schedule on {{date}} at {{time}}.",
		currentTimeLabel: "Current time: {{time}}",
		eventLabel:
			"{{className}} on {{date}}, {{startTime}} to {{endTime}}, {{status}}, {{type}}",
	},
} as const;
