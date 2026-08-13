import { createFileRoute } from "@tanstack/react-router";
import { AdminHomeScreen } from "@/screens/admin-home-screen";
import { adminUserSearchSchema } from "@/types/admin-user";

export const Route = createFileRoute("/_layout/")({
	component: AdminHomeScreen,
	validateSearch: adminUserSearchSchema,
});
