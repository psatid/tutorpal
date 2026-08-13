export default {
	login: {
		eyebrow: "TutorPal Admin",
		title: "Sign in to your admin portal",
		subtitle:
			"Manage TutorPal access and create user accounts from one secure workspace.",
		emailPlaceholder: "admin@example.com",
		passwordPlaceholder: "Enter your password",
		submit: "Sign in",
		error: "Unable to sign in.",
		footer:
			"Admin accounts are provisioned by the application owner. Public signup is not available here.",
	},
	users: {
		title: "User management",
		total: "{{count}} users",
		description: "Create and manage regular TutorPal user accounts.",
		listLabel: "Users",
		namePlaceholder: "Alex Morgan",
		emailPlaceholder: "alex@example.com",
		passwordPlaceholder: "At least 8 characters",
		columns: {
			user: "User",
			verification: "Verification",
			status: "Status",
			created: "Created",
			actions: "Actions",
		},
		search: {
			label: "Search users",
			placeholder: "Search name or email",
		},
		statusFilter: {
			label: "Filter by status",
			all: "All statuses",
		},
		status: {
			active: "Active",
			deactivated: "Deactivated",
		},
		verification: {
			verified: "Verified",
			unverified: "Unverified",
		},
		actions: {
			create: "Create user",
			edit: "Edit",
			setPassword: "Set password",
			resendVerification: "Resend verification",
			deactivate: "Deactivate",
			reactivate: "Reactivate",
			cancel: "Cancel",
			clearFilters: "Clear filters",
			save: "Save changes",
			openFor: "Open actions for {{name}}",
		},
		create: {
			title: "Create user",
			description: "Create a regular user and send a verification email.",
		},
		edit: {
			title: "Edit user",
			description: "Update the name or email address for {{name}}.",
		},
		password: {
			title: "Set password",
			description: "Set a new password for {{name}}. Existing sessions will be signed out.",
			confirmPlaceholder: "Re-enter the new password",
		},
		confirmDeactivate: {
			title: "Deactivate user?",
			description: "{{name}} will no longer be able to access TutorPal until reactivated.",
		},
		confirmReactivate: {
			title: "Reactivate user?",
			description: "{{name}} will be able to access TutorPal again.",
		},
		feedback: {
			created: "User created and verification email sent.",
			createdWithoutVerification:
				"User created, but the verification email could not be sent. You can retry it later.",
			updated: "User updated.",
			updatedWithoutVerification:
				"User updated, but the verification email could not be sent.",
			passwordSet: "Password updated.",
			verificationSent: "Verification email sent.",
			deactivated: "User deactivated.",
			reactivated: "User reactivated.",
		},
		errors: {
			generic: "Unable to complete that action. Please try again.",
			emailInUse: "That email address is already in use.",
			notFound: "That user is no longer available.",
			alreadyVerified: "This user's email is already verified.",
			verificationFailed: "The verification email could not be sent. Please try again.",
		},
		error: {
			load: "Unable to load users",
			loadDescription: "Check your connection and try again.",
			refresh: "The list could not be refreshed. Showing the most recent users.",
		},
		retry: "Retry",
		loading: "Loading users…",
		refreshing: "Refreshing users…",
		emptyInitial: {
			title: "No users yet",
			description: "Create the first user to give them access to TutorPal.",
		},
		emptyFiltered: {
			title: "No matching users",
			description: "Try changing the search or status filter.",
		},
		pagination: {
			label: "User pagination",
			previous: "Previous",
			next: "Next",
			page: "Page {{page}} of {{totalPages}}",
			showing: "Showing {{start}}–{{end}} of {{total}}",
		},
	},
} as const;
