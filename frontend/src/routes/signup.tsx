import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SignupScreen } from "@/screens/signup-screen";
import { usePublicConfig } from "@/lib/public-config";

export const Route = createFileRoute("/signup")({
	component: SignupRoute,
});

function SignupRoute() {
	const { data, isPending } = usePublicConfig();

	if (isPending) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-background">
				<Loader2 className="size-8 animate-spin text-primary" />
			</div>
		);
	}

	// Keep an in-progress form mounted while a previously enabled config refreshes.
	if (!data?.publicSignupEnabled) {
		return <Navigate replace to="/login" />;
	}

	return <SignupScreen />;
}
