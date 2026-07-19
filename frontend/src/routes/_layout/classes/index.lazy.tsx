import { createLazyFileRoute } from "@tanstack/react-router";
import { ClassesScreen } from "@/screens/classes-screen";

export const Route = createLazyFileRoute("/_layout/classes/")({
	component: ClassesScreen,
});
