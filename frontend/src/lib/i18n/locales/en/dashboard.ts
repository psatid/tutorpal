export default {
  title: "Dashboard",
  description: "Your command center for managing tutoring sessions and students.",
  stats: {
    activeStudents: "Active Students",
    classesToday: "Classes Today",
  },
  today: {
    title: "Today",
    description: "Your sessions and the work ahead.",
    openSchedule: "Open schedule",
    sessions: "Sessions",
    sessionCount_one: "{{count}} session",
    sessionCount_other: "{{count}} sessions",
    loadError: "We couldn't load today's sessions.",
    retry: "Try again",
    emptyTitle: "No sessions scheduled",
    emptyDescription: "Your schedule is clear for today.",
    timezone: "Times shown in your local time",
  },
} as const;
