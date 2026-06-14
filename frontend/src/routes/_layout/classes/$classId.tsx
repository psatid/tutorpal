import { createFileRoute } from "@tanstack/react-router";
import { ClassDetailScreen } from "@/screens/class-detail-screen";

export const Route = createFileRoute("/_layout/classes/$classId")({
  component: ClassDetailRoute,
});

function ClassDetailRoute() {
  const { classId } = Route.useParams();
  return <ClassDetailScreen classId={classId} />;
}
