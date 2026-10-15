import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon as Loader2HugeIcon,
} from "@hugeicons/core-free-icons";
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
				<HugeiconsIcon icon={Loader2HugeIcon} strokeWidth={2} aria-hidden="true" className="size-8 animate-spin text-primary" />
			</div>
		);
	}

	// Keep an in-progress form mounted while a previously enabled config refreshes.
	if (!data?.publicSignupEnabled) {
		return <Navigate replace to="/login" />;
	}

	return <SignupScreen />;
}
