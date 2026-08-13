export default {
	appName: "TutorPal",
	form: {
		email: "Email",
		password: "Password",
		confirmPassword: "Confirm password",
		showPassword: "Show password",
		hidePassword: "Hide password",
		name: "Name",
		required: "This field is required",
		invalidEmail: "Please enter a valid email address",
		passwordTooShort: "Please use at least 8 characters for your password.",
		passwordsDoNotMatch: "Passwords do not match.",
	},
	profile: {
		greeting: "Hello, {{name}}",
		unknownName: "Unknown",
		unknownEmail: "No email address",
	},
	accessibility: {
		toggleSidebar: "Toggle sidebar",
		closeNamed: "Close {{title}}",
	},
	accessDenied: {
		title: "Admin access required",
		description:
			"Your account is signed in, but it does not have permission to manage users in this portal.",
		signOut: "Sign out",
	},
	routeError: {
		title: "We couldn’t open this page",
		description:
			"Something went wrong while opening TutorPal. Your work is safe—try again or return to your dashboard.",
		retry: "Try again",
		retrying: "Trying again…",
		dashboard: "Go to dashboard",
	},
	notFound: {
		title: "This page isn’t here",
		description:
			"The link may be out of date or the page may have moved. Let’s get you back to TutorPal.",
		dashboard: "Go to dashboard",
	},
} as const;
