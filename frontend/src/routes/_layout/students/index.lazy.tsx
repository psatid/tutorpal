import { createLazyFileRoute } from "@tanstack/react-router";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { StudentScreen } from "@/screens/student-screen";

export const Route = createLazyFileRoute("/_layout/students/")({
	component: StudentsRoute,
});

function StudentsRoute() {
	return (
		<ScreenLayout>
			<StudentScreen />
		</ScreenLayout>
	);
}
