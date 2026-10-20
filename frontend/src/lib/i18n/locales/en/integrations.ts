export default {
  title: "Integrations",
  description: "Connect the tools you use to teach and communicate with students.",
  groups: {
    messaging: "Messaging",
    onlineClasses: "Online classes",
  },
  line: {
    name: "LINE",
    description: "Message students from your LINE Official Account.",
    connected: "Connected",
    notConnected: "Not connected",
    connectionError: "We couldn't check your LINE connection. Try again.",
    setUp: "Set up LINE",
    manage: "Manage",
  },
  zoom: {
    name: "Zoom",
    description: "Create and manage online class meetings.",
    comingSoon: "Coming soon",
  },
  googleMeet: {
    name: "Google Meet",
    description: "Create and manage online class meetings.",
    comingSoon: "Coming soon",
  },
  loadingLine: "Loading LINE integration",
  retry: "Retry",
  privacyNote: "Your connection details are encrypted and used only for your teaching workspace.",
} as const;
