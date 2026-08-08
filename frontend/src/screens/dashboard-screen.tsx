import { CalendarDays, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { APP_ROUTES } from "@/constants/routes";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { DateTime } from "@/lib/date-time";
import { formatTime24Hour } from "@/lib/schedule-utils";
import { useSchedules } from "@/hooks/queries/use-schedules";

export function DashboardScreen() {
  const { t } = useTranslation(["dashboard", "schedules"]);
  const today = DateTime.today().toDateOnlyString();
  const { data: schedules, isError, isLoading, refetch } = useSchedules({
    date: today,
  });

  return (
    <section className="mx-auto w-full max-w-5xl">
      <header className="flex flex-col gap-2 border-b border-border py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {DateTime.today().format("EEEE, MMMM d")}
          </p>
          <h1 className="mt-1 text-3xl font-normal tracking-[-0.02em] text-foreground">
            {t("dashboard:today.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard:today.description")}
          </p>
        </div>
        <Link
          to={APP_ROUTES.SCHEDULES}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("dashboard:today.openSchedule")}
        </Link>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_12rem]">
        <section aria-labelledby="today-sessions-title" className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <h2 id="today-sessions-title" className="font-semibold text-foreground">
              {t("dashboard:today.sessions")}
            </h2>
            {!isLoading && !isError ? (
              <span className="tabular-nums text-sm text-muted-foreground">
                {t("dashboard:today.sessionCount", { count: schedules?.length ?? 0 })}
              </span>
            ) : null}
          </div>

          {isLoading ? <TodaySkeleton /> : null}
          {isError ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-muted-foreground">{t("dashboard:today.loadError")}</p>
              <Button className="mt-4" onClick={() => refetch()} variant="outline">
                {t("dashboard:today.retry")}
              </Button>
            </div>
          ) : null}
          {!isLoading && !isError && schedules?.length === 0 ? <TodayEmpty /> : null}
          {!isLoading && !isError && schedules && schedules.length > 0 ? (
            <ul>
              {schedules.map((schedule) => {
                const endTime = formatTime24Hour(schedule.time + schedule.durationMinutes);
                return (
                  <li className="flex min-h-20 items-center gap-4 border-b border-border px-4 py-4 last:border-b-0 sm:px-5" key={schedule.id}>
                    <div className="w-20 shrink-0 text-sm tabular-nums text-foreground">
                      <span className="font-semibold">{formatTime24Hour(schedule.time)}</span>
                      <span className="text-muted-foreground"> – {endTime}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{schedule.className}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {t(`schedules:type.${schedule.type}`)}
                      </p>
                    </div>
                    <span className="hidden text-sm tabular-nums text-muted-foreground sm:block">
                      {DateTime.formatDurationHours(schedule.durationMinutes / 60)}h
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>

        <aside className="h-fit rounded-lg border border-border bg-card p-4">
          <CalendarDays className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-5 text-sm font-medium text-muted-foreground">
            {t("dashboard:today.sessions")}
          </p>
          {isLoading ? <Skeleton className="mt-1 h-9 w-12" /> : null}
          {!isLoading ? (
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
              {isError ? "—" : schedules?.length ?? 0}
            </p>
          ) : null}
          <div className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
            <Clock3 className="mr-1 inline size-4" aria-hidden="true" />
            {t("dashboard:today.timezone")}
          </div>
        </aside>
      </div>
    </section>
  );
}

function TodaySkeleton() {
  return (
    <div className="px-5 py-1">
      {[0, 1, 2].map((index) => (
        <div className="flex min-h-20 items-center gap-4 border-b border-border last:border-b-0" key={index}>
          <Skeleton className="h-4 w-20" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TodayEmpty() {
  const { t } = useTranslation(["dashboard"]);

  return (
    <div className="px-5 py-12 text-center">
      <CalendarDays className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 font-medium text-foreground">{t("dashboard:today.emptyTitle")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("dashboard:today.emptyDescription")}</p>
    </div>
  );
}
