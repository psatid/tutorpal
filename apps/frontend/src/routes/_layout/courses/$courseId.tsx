import { createFileRoute } from "@tanstack/react-router";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { CourseDetailScreen } from "@/screens/course-detail-screen";

export const Route = createFileRoute("/_layout/courses/$courseId")({
	component: CourseDetailRoute,
});

function CourseDetailRoute() {
	const { courseId } = Route.useParams();

	return (
		<ScreenLayout>
			<CourseDetailScreen courseId={courseId} />
		</ScreenLayout>
	);
}
