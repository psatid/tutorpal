import { useQuery } from "@tanstack/react-query";
import { lineQueryKeys } from "@/constants/query-keys/line-query-keys";
import {
	getLineConnection,
	type LineConnectionStatus,
} from "@/lib/line-settings-api";
import type { BaseQuery } from "@/types/base-query";

type FetchLineConnectionParams<T> = BaseQuery<T, LineConnectionStatus>;

export const useFetchLineConnection = <T = LineConnectionStatus>(
	options: FetchLineConnectionParams<T> = {},
) =>
	useQuery({
		queryKey: lineQueryKeys.connection(),
		queryFn: getLineConnection,
		...options,
		retry: false,
	});
