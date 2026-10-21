import { type KeyboardEvent, type RefObject, type UIEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/button";
import { ScreenLayoutEdge } from "@/components/layout/screen-layout";
import { Skeleton } from "@/components/common/skeleton";
import { DateTime } from "@/lib/date-time";
import { Schedule } from "@/models/schedule";

const LOAD_MORE_THRESHOLD = 160;
const COMPLETE_ACTION_ID_PREFIX = "awaiting-confirmation-complete-action-";

export function getAwaitingConfirmationCompleteActionId(scheduleId: string) {
  return `${COMPLETE_ACTION_ID_PREFIX}${encodeURIComponent(scheduleId)}`;
}

type AwaitingConfirmationCarouselProps = {
  schedules: Schedule[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  hasNextPage: boolean;
  isBusy: boolean;
  completingScheduleId: string | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onComplete: (schedule: Schedule) => void;
  onNoShow: (
    schedule: Schedule,
    trigger: HTMLButtonElement,
  ) => void;
  onRetry: () => void;
  onLoadMore: () => Promise<unknown>;
};

export function AwaitingConfirmationCarousel({
  schedules,
  isLoading,
  isError,
  isFetchingNextPage,
  isFetchNextPageError,
  hasNextPage,
  isBusy,
  completingScheduleId,
  headingRef,
  onComplete,
  onNoShow,
  onRetry,
  onLoadMore,
}: AwaitingConfirmationCarouselProps) {
  const { t } = useTranslation("dashboard");
  const titleId = "sessions-to-confirm-title";
  const instructionId = "sessions-to-confirm-instruction";
  const loadMoreRequestRef = useRef(false);

  const requestNextPage = () => {
    if (
      !hasNextPage ||
      isFetchingNextPage ||
      loadMoreRequestRef.current
    ) {
      return;
    }

    loadMoreRequestRef.current = true;
    void onLoadMore()
      .catch(() => undefined)
      .finally(() => {
        loadMoreRequestRef.current = false;
      });
  };

  const loadMoreWhenNearEnd = (scrollport: HTMLDivElement) => {
    const remainingScrollDistance =
      scrollport.scrollWidth - scrollport.scrollLeft - scrollport.clientWidth;

    if (
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError &&
      remainingScrollDistance <= LOAD_MORE_THRESHOLD
    ) {
      requestNextPage();
    }
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    loadMoreWhenNearEnd(event.currentTarget);
  };

  const handleScrollportKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      event.currentTarget.scrollTo({ left: 0, behavior: "auto" });
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      event.currentTarget.scrollTo({
        left: event.currentTarget.scrollWidth,
        behavior: "auto",
      });
      return;
    }

    const direction =
      event.key === "ArrowRight" || event.key === "PageDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "PageUp"
          ? -1
          : 0;

    if (direction !== 0) {
      const scrollAmount =
        event.key === "PageDown" || event.key === "PageUp"
          ? event.currentTarget.clientWidth * 0.8
          : Math.max(160, event.currentTarget.clientWidth * 0.8);

      event.preventDefault();
      event.currentTarget.scrollBy({
        left: direction * scrollAmount,
        behavior: "auto",
      });
    }
  };

  return (
    <section
      aria-busy={isLoading || isFetchingNextPage || isBusy}
      aria-labelledby={titleId}
      className="mt-6 min-w-0"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="inline-block rounded-sm font-semibold text-foreground focus:outline-none focus:ring-[3px] focus:ring-primary/35 focus:ring-offset-2"
          >
            {t("today.awaitingConfirmation.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("today.awaitingConfirmation.description")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <AwaitingConfirmationSkeleton
          instructionId={instructionId}
          loadingLabel={t("today.awaitingConfirmation.loading")}
          titleId={titleId}
        />
      ) : isError && schedules.length === 0 ? (
        <AwaitingConfirmationError
          description={t("today.awaitingConfirmation.error")}
          onRetry={onRetry}
          retryLabel={t("today.awaitingConfirmation.retry")}
        />
      ) : schedules.length === 0 ? (
        <AwaitingConfirmationEmpty />
      ) : (
        <ScreenLayoutEdge
          mobileOnly
          aria-describedby={instructionId}
          aria-label={t("today.awaitingConfirmation.scrollportLabel")}
          className="mt-4 min-w-0 snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onKeyDown={handleScrollportKeyDown}
          onScroll={handleScroll}
          role="group"
          tabIndex={0}
        >
          <p className="sr-only" id={instructionId}>
            {t("today.awaitingConfirmation.scrollInstruction")}
          </p>
          <ol className="flex min-w-max gap-3 sm:gap-4">
            {schedules.map((schedule) => (
                <AwaitingConfirmationCard
                  completing={completingScheduleId === schedule.getId()}
                  disabled={isBusy}
                  key={schedule.getId()}
                  onComplete={onComplete}
                  onNoShow={onNoShow}
                  schedule={schedule}
                />
            ))}
            {isFetchingNextPage ? (
              <AwaitingConfirmationLoadingMore
                label={t("today.awaitingConfirmation.loadingMore")}
              />
            ) : null}
            {isFetchNextPageError ? (
              <AwaitingConfirmationLoadMoreError
                description={t("today.awaitingConfirmation.loadMoreError")}
                onRetry={requestNextPage}
                retryLabel={t("today.awaitingConfirmation.retry")}
              />
            ) : null}
          </ol>
        </ScreenLayoutEdge>
      )}
    </section>
  );
}

function AwaitingConfirmationCard({
  schedule,
  disabled,
  completing,
  onComplete,
  onNoShow,
}: {
  schedule: Schedule;
  disabled: boolean;
  completing: boolean;
  onComplete: (schedule: Schedule) => void;
  onNoShow: (
    schedule: Schedule,
    trigger: HTMLButtonElement,
  ) => void;
}) {
  const { t } = useTranslation(["dashboard", "schedules"]);
	const startDate = DateTime.fromDateOnlyString(schedule.getDate());
  const date = DateTime.formatDate(startDate, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
	const startTime = schedule.getStartTimeLabel();
	const endTime = schedule.getEndClockTimeLabel();
	const { endDate, endDayOffset } = schedule.getEndDateData();
  const endDateLabel = DateTime.formatDate(endDate, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const endDateTimeLabel = t(
    "dashboard:today.awaitingConfirmation.endDateTime",
    { date: endDateLabel, time: endTime },
  );
  const timeRange = `${startTime} – ${
    endDayOffset > 0 ? endDateTimeLabel : endTime
  }`;

  return (
    <li className="w-[17rem] shrink-0 snap-start rounded-lg border border-border bg-card p-4 sm:w-72">
      <p className="text-sm font-medium text-muted-foreground">
		<time dateTime={schedule.getDate()}>{date}</time>
      </p>
      <p
        className="mt-3 min-h-10 line-clamp-2 wrap-break-word font-semibold leading-5 text-foreground"
		title={schedule.getClassName()}
      >
		{schedule.getClassName()}
      </p>
      <p className="mt-2 text-sm font-medium tabular-nums text-foreground">
		<time dateTime={`${schedule.getDate()}T${startTime}`}>{startTime}</time>
        <span aria-hidden="true"> – </span>
        <time
          aria-label={endDayOffset > 0 ? endDateTimeLabel : undefined}
          dateTime={`${endDate.toDateOnlyString()}T${endTime}`}
        >
          {endTime}
        </time>
        {endDayOffset > 0 ? (
          <span
            aria-hidden="true"
            className="ml-1 text-xs font-normal text-muted-foreground"
          >
            {t("dashboard:today.awaitingConfirmation.endDayOffset", {
              count: endDayOffset,
            })}
          </span>
        ) : null}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button
          aria-label={t("dashboard:today.awaitingConfirmation.completeAction", {
			className: schedule.getClassName(),
            date,
            time: timeRange,
          })}
          disabled={disabled}
		id={getAwaitingConfirmationCompleteActionId(schedule.getId())}
          loading={completing}
          onClick={() => onComplete(schedule)}
          type="button"
        >
          {t("schedules:complete.action")}
        </Button>
        <Button
          aria-label={t("dashboard:today.awaitingConfirmation.noShowAction", {
			className: schedule.getClassName(),
            date,
            time: timeRange,
          })}
          disabled={disabled}
          onClick={(event) => onNoShow(schedule, event.currentTarget)}
          type="button"
          variant="outline"
        >
          {t("dashboard:today.noShowAction")}
        </Button>
      </div>
    </li>
  );
}

function AwaitingConfirmationSkeleton({
  titleId,
  instructionId,
  loadingLabel,
}: {
  titleId: string;
  instructionId: string;
  loadingLabel: string;
}) {
  return (
    <ScreenLayoutEdge
      mobileOnly
      aria-describedby={instructionId}
      aria-labelledby={titleId}
      className="mt-4 min-w-0 overflow-x-hidden pb-2"
      role="status"
    >
      <span className="sr-only" id={instructionId}>
        {loadingLabel}
      </span>
      <div className="flex min-w-max gap-3 sm:gap-4">
        {[0, 1].map((index) => (
          <div
            className="w-[17rem] shrink-0 rounded-lg border border-border bg-card p-4 sm:w-72"
            key={index}
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-5 w-40 max-w-full" />
            <Skeleton className="mt-3 h-4 w-24" />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Skeleton className="h-11 rounded-full" />
              <Skeleton className="h-11 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </ScreenLayoutEdge>
  );
}

function AwaitingConfirmationEmpty() {
  const { t } = useTranslation("dashboard");

  return (
    <div className="mt-4 rounded-lg border border-border bg-card px-4 py-5 sm:px-5">
      <h3 className="font-semibold text-foreground">
        {t("today.awaitingConfirmation.emptyTitle")}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("today.awaitingConfirmation.emptyDescription")}
      </p>
    </div>
  );
}

function AwaitingConfirmationError({
  description,
  retryLabel,
  onRetry,
}: {
  description: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-card px-4 py-5 sm:px-5">
      <p className="text-sm text-muted-foreground" role="alert">
        {description}
      </p>
      <Button className="mt-4" onClick={onRetry} type="button" variant="outline">
        {retryLabel}
      </Button>
    </div>
  );
}

function AwaitingConfirmationLoadingMore({ label }: { label: string }) {
  return (
    <li
      aria-label={label}
      className="w-[17rem] shrink-0 snap-start rounded-lg border border-border bg-card p-4 sm:w-72"
      role="status"
    >
      <span className="sr-only">{label}</span>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-5 w-40 max-w-full" />
      <Skeleton className="mt-3 h-4 w-24" />
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Skeleton className="h-11 rounded-full" />
        <Skeleton className="h-11 rounded-full" />
      </div>
    </li>
  );
}

function AwaitingConfirmationLoadMoreError({
  description,
  retryLabel,
  onRetry,
}: {
  description: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <li className="w-[17rem] shrink-0 snap-start rounded-lg border border-border bg-card p-4 sm:w-72">
      <p className="text-sm text-muted-foreground" role="alert">
        {description}
      </p>
      <Button className="mt-4" onClick={onRetry} type="button" variant="outline">
        {retryLabel}
      </Button>
    </li>
  );
}
