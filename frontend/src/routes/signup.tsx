import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SignupScreen } from "@/screens/signup-screen";
import { usePublicConfig } from "@/lib/public-config";

export const Route = createFileRoute("/signup")({
	component: SignupRoute,
});

function SignupRoute() {
	const { isPending, publicSignupEnabled } = usePublicConfig();

	if (isPending) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-surface">
				<Loader2 className="size-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!publicSignupEnabled) {
		return <Navigate replace to="/login" />;
	}

	return <SignupScreen />;
}
