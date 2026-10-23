import type { GetV1Config200 } from "@/api/generated/models/getV1Config200";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";

const publicConfigQueryKey = ["public-config"] as const;

export type PublicConfig = GetV1Config200;

function isPublicConfig(payload: unknown): payload is GetV1Config200 {
	if (typeof payload !== "object" || payload === null) {
		return false;
	}

	const config = payload as Record<string, unknown>;
	if (
		Object.keys(config).length !== 2 ||
		!Object.hasOwn(config, "publicSignupEnabled") ||
		!Object.hasOwn(config, "socialLogin") ||
		typeof config.publicSignupEnabled !== "boolean" ||
		typeof config.socialLogin !== "object" ||
		config.socialLogin === null
	) {
		return false;
	}

	const socialLogin = config.socialLogin as Record<string, unknown>;
	return (
		Object.keys(socialLogin).length === 2 &&
		Object.hasOwn(socialLogin, "google") &&
		Object.hasOwn(socialLogin, "line") &&
		typeof socialLogin.google === "boolean" &&
		typeof socialLogin.line === "boolean"
	);
}

const disabledPublicConfig: PublicConfig = {
	publicSignupEnabled: false,
	socialLogin: {
		google: false,
		line: false,
	},
};

async function fetchPublicConfig(): Promise<PublicConfig> {
	const payload: unknown = (await apiClient.getV1Config()).data;
	if (!isPublicConfig(payload)) {
		throw new Error("Invalid public configuration response");
	}

	return payload;
}

export function usePublicConfig() {
	const query = useQuery({
		queryKey: publicConfigQueryKey,
		queryFn: fetchPublicConfig,
		staleTime: 1000 * 60 * 5,
		refetchInterval: 1000 * 60,
		refetchIntervalInBackground: true,
	});
	const config =
		query.isPending || query.isError || query.isStale || query.isFetching
			? disabledPublicConfig
			: (query.data ?? disabledPublicConfig);

	return {
		...query,
		publicSignupEnabled: config.publicSignupEnabled,
		socialLogin: config.socialLogin,
	};
}
