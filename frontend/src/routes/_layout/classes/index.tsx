import { createFileRoute } from "@tanstack/react-router";
import { ClassesScreen } from "@/screens/classes-screen";

export const Route = createFileRoute("/_layout/classes/")({
  component: ClassesScreen,
});
