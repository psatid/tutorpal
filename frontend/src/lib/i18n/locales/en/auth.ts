export default {
	brand: {
		eyebrow: "TutorPal",
	},
	legal: "By continuing, you agree to our Terms of Service and Privacy Policy.",
	errors: {
		loginFailed: "Login failed.",
		signupFailed: "Signup failed.",
		passwordResetRequestFailed: "Failed to request password reset.",
		passwordResetFailed: "Failed to reset password.",
		resendVerificationFailed: "Failed to resend verification email.",
	},
	login: {
		title: "Welcome back",
		subtitle: "Sign in to continue managing your students and classes.",
		emailPlaceholder: "Enter your email",
		passwordPlaceholder: "Enter your password",
		forgotPassword: "Forgot password?",
		submit: "Sign In",
		alternatePrompt: "Don't have an account yet?",
		alternateAction: "Create account",
		success: "Welcome back! You have been logged in.",
		invalid: "Invalid email or password. Please try again.",
		unverified:
			"Your email is not verified yet. We sent you a new confirmation email.",
	},
	forgotPassword: {
		title: "Reset your password",
		subtitle:
			"Enter your email and we will send you a reset link if an account exists.",
		emailPlaceholder: "Enter your email",
		submit: "Send reset link",
		successTitle: "Check your inbox",
		successBody:
			"If an account exists for {{email}}, we sent a password reset link.",
		successCta: "Back to sign in",
	},
	resetPassword: {
		title: "Choose a new password",
		subtitle: "Create a new password for your TutorPal account.",
		passwordPlaceholder: "Enter a new password",
		confirmPlaceholder: "Confirm your new password",
		confirmLabel: "Confirm password",
		submit: "Reset password",
		success: "Your password has been reset. Please sign in.",
		backToLogin: "Back to sign in",
		invalidTitle: "Reset link unavailable",
		invalidBody:
			"This reset link is invalid or has expired. Request a new password reset email and try again.",
		invalidCta: "Request new reset link",
		passwordMismatch: "Passwords do not match.",
		passwordTooShort: "Please use at least 8 characters for your password.",
	},
	signup: {
		title: "Create your account",
		subtitle: "Set up TutorPal in a few quick steps.",
		submit: "Create account",
		successTitle: "Check your inbox",
		successBody:
			"We sent a confirmation link to {{email}}. Verify your email before signing in.",
		resend: "Resend email",
		resendSuccess: "A new confirmation email is on its way.",
		resendError: "We couldn't resend the email right now. Please try again.",
		emailExists:
			"That email is already in use. Try signing in or use another email.",
		alternatePrompt: "Already have an account?",
		alternateAction: "Sign in",
		steps: {
			name: {
				title: "What's your name?",
				description: "We'll use this to personalize your workspace.",
				placeholder: "Your full name",
			},
			email: {
				title: "What's your email?",
				description: "We'll send your confirmation link here.",
				placeholder: "Enter your email",
			},
			password: {
				title: "Create a password",
				description: "Use at least 8 characters to keep your account secure.",
				placeholder: "Create a password",
				error: "Please use at least 8 characters for your password.",
			},
		},
	},
	verifyEmail: {
		title: "Email verified",
		subtitle:
			"Your account is ready. You can sign in and start using TutorPal.",
		errorTitle: "Verification link unavailable",
		errors: {
			INVALID_TOKEN:
				"That confirmation link is invalid. Request a new verification email and try again.",
			TOKEN_EXPIRED:
				"That confirmation link has expired. Request a fresh verification email.",
			default:
				"We couldn't verify your email with that link. Please request a new verification email.",
		},
		cta: "Go to sign in",
		resend: "Send another verification email",
	},
} as const;
