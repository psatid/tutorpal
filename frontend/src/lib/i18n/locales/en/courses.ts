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
		"This course will be permanently removed. This action cannot be undone.",
	cancel: "Cancel",
	formDescription: "Set reusable defaults for future classes.",
	searchLabel: "Search courses",
	actionsFor: "Actions for {{name}}",
	classCount_one: "{{count}} class",
	classCount_other: "{{count}} classes",
	viewClasses: "View classes ({{count}})",
	searchCourses: "Search courses",
	noCourses: "No courses yet",
	noMatches: "No matching courses",
	noMatchesDescription: "Try a different course name.",
	noCoursesDescription:
		"Create a reusable course to speed up class setup and keep default hours consistent.",
	defaultHours: "{{hours}} default hours",
	courseInUse: "This course still has classes and cannot be deleted.",
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
