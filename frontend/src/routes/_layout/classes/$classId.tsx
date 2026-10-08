import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { ClassDetailScreen } from "@/screens/class-detail-screen";

const classDetailSearchSchema = z.object({
  addHours: z.boolean().optional(),
  setup: z.literal("getting-started").optional(),
});

export const Route = createFileRoute("/_layout/classes/$classId")({
  validateSearch: classDetailSearchSchema,
  component: ClassDetailRoute,
});

function ClassDetailRoute() {
  const { classId } = Route.useParams();
  const { addHours, setup } = Route.useSearch();
  return (
    <ScreenLayout>
      <ClassDetailScreen
        classId={classId}
        openHourAdditionsOnMount={addHours === true}
        returnToDashboardOnHoursAdded={setup === "getting-started"}
      />
    </ScreenLayout>
  );
}
