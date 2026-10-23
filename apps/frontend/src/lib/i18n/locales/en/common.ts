export default {
  appName: "TutorPal",
  buttons: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    add: "Add",
    search: "Search",
    signIn: "Sign In",
    continue: "Continue",
    signOut: "Sign Out",
    submit: "Submit",
  },
  form: {
    email: "Email",
    password: "Password",
    name: "Name",
    description: "Description",
    required: "This field is required",
    invalidEmail: "Please enter a valid email address",
  },
  profile: {
    greeting: "Hello, {{name}}",
    unknownName: "Unknown",
    unknownEmail: "No email address",
    avatarAlt: "Profile photo",
  },
  impersonation: {
    banner: {
      label: "Tutor view notice",
      title: "Tutor view is active",
      description: "You are viewing TutorPal as {{name}}.",
      exitError: "We couldn’t return to the admin view. Try again.",
      recovery:
        "Your original admin session is no longer available. Sign in to the admin portal again.",
      recoveryLink: "Go to admin sign in",
    },
  },
  accessibility: {
    toggleSidebar: "Toggle sidebar",
    primaryNavigation: "Primary navigation",
  },
  loading: "Loading...",
  error: "An error occurred",
  retry: "Retry",
  empty: "No items found",
  today: "Today",
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
