import type { InfiniteData } from "@tanstack/react-query";

export type BaseQuery<T, N> = {
	select?: (data: N | undefined) => Awaited<T>;
	enabled?: boolean;
	placeholderData?: N | ((previousData: N | undefined) => N | undefined);
};

export type BaseInfiniteQuery<T, N> = {
	select?: (data: InfiniteData<N> | undefined) => Awaited<T>;
	enabled?: boolean;
	placeholderData?:
		| InfiniteData<N>
		| ((previousData: InfiniteData<N> | undefined) => InfiniteData<N> | undefined);
};
