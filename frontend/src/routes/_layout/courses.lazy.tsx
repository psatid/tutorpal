import { createLazyFileRoute } from "@tanstack/react-router";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { CoursesScreen } from "@/screens/courses-screen";

export const Route = createLazyFileRoute("/_layout/courses")({
	component: CoursesRoute,
});

function CoursesRoute() {
	return (
		<ScreenLayout>
			<CoursesScreen />
		</ScreenLayout>
	);
}
