import { createLazyFileRoute } from "@tanstack/react-router";
import { CoursesScreen } from "@/screens/courses-screen";

export const Route = createLazyFileRoute("/_layout/courses")({
	component: CoursesScreen,
});
