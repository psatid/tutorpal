import { useQuery } from "@tanstack/react-query";
import { ENV } from "./env";

const publicConfigQueryKey = ["public-config"] as const;

type PublicConfigResponse = {
	publicSignupEnabled?: unknown;
};

export type PublicConfig = {
	publicSignupEnabled: boolean;
};

async function fetchPublicConfig(): Promise<PublicConfig> {
	const response = await fetch(new URL("/v1/config", ENV.API_URL), {
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(`Public configuration request failed: ${response.status}`);
	}

	const payload = (await response.json()) as PublicConfigResponse;

	return {
		publicSignupEnabled: payload.publicSignupEnabled === true,
	};
}

export function usePublicConfig() {
	const query = useQuery({
		queryKey: publicConfigQueryKey,
		queryFn: fetchPublicConfig,
		staleTime: 1000 * 60 * 5,
	});

	return {
		...query,
		publicSignupEnabled: query.data?.publicSignupEnabled ?? false,
	};
}
