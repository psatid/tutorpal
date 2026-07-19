import { createLazyFileRoute } from "@tanstack/react-router";
import { StudentScreen } from "@/screens/student-screen";

export const Route = createLazyFileRoute("/_layout/students/")({
	component: StudentScreen,
});
