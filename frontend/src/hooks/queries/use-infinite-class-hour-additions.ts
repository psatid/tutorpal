import type { InfiniteData } from "@tanstack/react-query";
import type { GetV1ClassesByIdHourAdditions200 } from "@/api/generated/models/getV1ClassesByIdHourAdditions200";
import { ClassHourAddition } from "@/models/class-hour-addition";
import type { ClassHourAdditionList } from "@/types/class-hour-addition-query";
import { useFetchInfiniteClassHourAdditions } from "./use-fetch-infinite-class-hour-additions";

type InfiniteClassHourAdditionList = InfiniteData<ClassHourAdditionList>;

const selectInfiniteClassHourAdditions = (
	data: InfiniteData<GetV1ClassesByIdHourAdditions200> | undefined,
): InfiniteClassHourAdditionList => ({
	pages:
		data?.pages.map((page) => ({
			additions: page.data.map(ClassHourAddition.fromResponse),
			pagination: page.pagination,
		})) ?? [],
	pageParams: data?.pageParams ?? [],
});

export function useInfiniteClassHourAdditions(classId: string | null) {
	return useFetchInfiniteClassHourAdditions<InfiniteClassHourAdditionList>({
		classId,
		select: selectInfiniteClassHourAdditions,
	});
}
