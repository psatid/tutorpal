import { createLazyFileRoute } from "@tanstack/react-router";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { ClassesScreen } from "@/screens/classes-screen";

export const Route = createLazyFileRoute("/_layout/classes/")({
	component: ClassesRoute,
});

function ClassesRoute() {
	return (
		<ScreenLayout>
			<ClassesScreen />
		</ScreenLayout>
	);
}
