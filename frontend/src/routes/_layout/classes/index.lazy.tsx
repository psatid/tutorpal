import { createLazyFileRoute, useSearch } from "@tanstack/react-router";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { ClassesScreen } from "@/screens/classes-screen";

export const Route = createLazyFileRoute("/_layout/classes/")({
	component: ClassesRoute,
});

function ClassesRoute() {
	const { setup } = useSearch({ strict: false }) as {
		setup?: "getting-started";
	};
	return (
		<ScreenLayout>
			<ClassesScreen setupIntent={setup} />
		</ScreenLayout>
	);
}
