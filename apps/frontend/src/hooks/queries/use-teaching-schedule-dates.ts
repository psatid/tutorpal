import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { DateTime } from "@/lib/date-time";
import { Schedule } from "@/models/schedule";
import { getFetchSchedulesQueryOptions } from "./use-fetch-schedules";

export type TeachingScheduleDateRange = {
  startDate: string;
  endDate: string;
};

const MAX_RANGE_WEEKS = 4;

function getRangeChunks(ranges: TeachingScheduleDateRange[]) {
  const weekRanges = ranges
    .map(({ startDate, endDate }) => ({
      start: DateTime.fromDateOnlyString(startDate).startOfWeek(),
      end: DateTime.fromDateOnlyString(endDate).startOfWeek(),
    }))
    .sort((left, right) => left.start.compareAsc(right.start));
  const mergedRanges: Array<{ start: DateTime; end: DateTime }> = [];

  for (const range of weekRanges) {
    const previousRange = mergedRanges.at(-1);

    if (!previousRange || previousRange.end.addDays(1).isBefore(range.start)) {
      mergedRanges.push(range);
      continue;
    }

    if (previousRange.end.isBefore(range.end)) {
      previousRange.end = range.end;
    }
  }

  return mergedRanges.flatMap((range) => {
    const chunks: TeachingScheduleDateRange[] = [];
    let start = range.start;

    while (!range.end.isBefore(start)) {
      let end = start;

      for (let week = 1; week < MAX_RANGE_WEEKS; week += 1) {
        const nextWeek = end.addWeeks(1);

        if (range.end.isBefore(nextWeek)) break;
        end = nextWeek;
      }

      const endDate = DateTime.getWeekDates(end).at(-1)!;

      chunks.push({
        startDate: start.toDateOnlyString(),
        endDate: endDate.toDateOnlyString(),
      });
      start = end.addWeeks(1);
    }

    return chunks;
  });
}

export function useTeachingScheduleDates(ranges: TeachingScheduleDateRange[]) {
  const rangeKey = ranges
    .map(({ startDate, endDate }) => `${startDate}:${endDate}`)
    .sort()
    .join(",");
  const queryRanges = useMemo(() => getRangeChunks(ranges), [rangeKey]);
  const queries = useQueries({
    queries: queryRanges.map(({ startDate, endDate }) =>
      getFetchSchedulesQueryOptions({ startDate, endDate }),
    ),
  });

  return useMemo(() => {
    const teachingDateKeys = new Set<string>();

    for (const query of queries) {
      for (const schedule of query.data ?? []) {
        const model = Schedule.fromListItem(schedule);

        if (model.isTimelineEligible()) {
          teachingDateKeys.add(model.getDate());
        }
      }
    }

    return teachingDateKeys;
  }, [queries]);
}
