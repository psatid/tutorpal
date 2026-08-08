export default {
	title: "Courses",
	subtitle:
		"Reusable teaching templates that set the starting hours for new classes.",
	count_one: "{{count}} course",
	count_other: "{{count}} courses",
	newCourse: "New course",
	createCourse: "Create course",
	editCourse: "Edit course",
	saveChanges: "Save changes",
	deleteCourse: "Delete course",
	deleteTitle: "Delete {{name}}?",
	deleteDescription:
		"This permanently deletes this reusable course. Classes are never deleted.",
	deleteBlockedTitle: "Can’t delete {{name}}",
	deleteBlockedDescription_one:
		"This reusable course currently has {{count}} class, so it can’t be deleted. Classes are never deleted.",
	deleteBlockedDescription_other:
		"This reusable course currently has {{count}} classes, so it can’t be deleted. Classes are never deleted.",
	checkingCourseTitle: "Checking {{name}}",
	checkingCourseClasses: "Checking the current classes for this course…",
	revalidationErrorTitle: "Couldn’t check {{name}}",
	revalidationErrorDescription:
		"We couldn’t confirm the current classes for this course. Try again before deleting it.",
	deleteSuccess: "Course deleted.",
	deleteAlreadyRemoved: "This course was already removed. The course list has been refreshed.",
	deletingCourse: "Deleting course…",
	deleteError: {
		unknown: "We couldn’t delete this course. Try again or cancel.",
	},
	cancel: "Cancel",
	close: "Close",
	tryAgain: "Try again",
	formDescription: "Set reusable defaults for future classes.",
	searchLabel: "Search courses",
	actionsFor: "Actions for {{name}}",
	classCount_one: "{{count}} class",
	classCount_other: "{{count}} classes",
	viewClasses: "View classes ({{count}})",
	viewClassesAction: "View classes",
	searchCourses: "Search courses",
	noCourses: "No courses yet",
	noMatches: "No matching courses",
	noMatchesDescription: "Try a different course name.",
	noCoursesDescription:
		"Create a reusable course to speed up class setup and keep default hours consistent.",
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
		hoursLabel: "Default total hours",
		hoursDescription:
			"New classes start with this amount. Existing classes never change automatically.",
	},
} as const;
