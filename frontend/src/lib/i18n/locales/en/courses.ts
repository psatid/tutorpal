export default {
	title: "Courses",
	subtitle:
		"Reusable hour presets you can apply whenever a class needs more time.",
	count_one: "{{count}} course",
	count_other: "{{count}} courses",
	newCourse: "New course",
	createCourse: "Create course",
	editCourse: "Edit course",
	saveChanges: "Save changes",
	deleteCourse: "Delete course",
	deleteTitle: "Delete {{name}}?",
	deleteDescription:
		"This permanently deletes this reusable course. Hours already added from it stay recorded on their classes.",
	deleteSuccess: "Course deleted.",
	deleteAlreadyRemoved: "This course was already removed. The course list has been refreshed.",
	deletingCourse: "Deleting course…",
	deleteError: {
		unknown: "We couldn’t delete this course. Try again or cancel.",
	},
	cancel: "Cancel",
	close: "Close",
	tryAgain: "Try again",
	formDescription: "Set reusable hours for future additions.",
	searchLabel: "Search courses",
	clearSearch: "Clear search",
	reset: "Reset",
	sortLabel: "Sort",
	actionsFor: "Actions for {{name}}",
	searchCourses: "Search courses",
	noCourses: "No courses yet",
	noMatches: "No matching courses",
	noMatchesDescription: "Try a different course name.",
	noCoursesDescription:
		"Create a reusable course to add its configured hours to classes later.",
	defaultHours: "{{hours}} default hours",
	loadError: {
		title: "Courses couldn’t load",
		description: "Check your connection and try again.",
	},
	sort: {
		"name-asc": "Name A–Z",
		"createdAt-desc": "Newest first",
		"defaultTotalHours-desc": "Highest hours",
	},
	validation: {
		courseName: "Enter a course name.",
		hours: "Enter hours greater than zero.",
	},
	form: {
		nameLabel: "Course name",
		namePlaceholder: "e.g. Mathematics",
		hoursLabel: "Preset hours",
		hoursDescription:
			"This amount is added when you choose this course for a class. Changes affect future additions only.",
	},
} as const;
