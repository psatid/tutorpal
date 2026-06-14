import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { classesKeys } from "./query-keys";
import type { GetV1ClassesParams } from "@/api/generated/models/getV1ClassesParams";

export const useInfiniteClasses = (params?: GetV1ClassesParams) => {
  return useInfiniteQuery({
    queryKey: classesKeys.infinite(params),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.getV1Classes({
        ...params,
        page: pageParam,
        limit: 10,
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
};
