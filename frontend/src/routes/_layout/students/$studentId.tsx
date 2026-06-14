import { createFileRoute } from "@tanstack/react-router";
import { StudentDetailScreen } from "@/screens/student-detail-screen";

export const Route = createFileRoute("/_layout/students/$studentId")({
  component: StudentDetailRoute,
});

function StudentDetailRoute() {
  const { studentId } = Route.useParams();
  return <StudentDetailScreen studentId={studentId} />;
}
