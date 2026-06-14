import { createFileRoute } from "@tanstack/react-router";
import { StudentScreen } from "@/screens/student-screen";

export const Route = createFileRoute("/_layout/students/")({
  component: StudentScreen,
});
