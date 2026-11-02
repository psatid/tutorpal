import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon as AddHugeIcon,
  Calendar03Icon as CalendarHugeIcon,
  PencilEdit01Icon as PencilHugeIcon,
  UserGroupIcon as UsersHugeIcon,
} from "@hugeicons/core-free-icons";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@tutorpal/ui/avatar";
import { Button } from "@tutorpal/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@tutorpal/ui/popover";
import { Class } from "@/models/class";
import { getNameTone, nameToneAvatarClasses } from "@/lib/name-tone";

interface ClassInfoHeaderProps {
  classData: Class;
  addHoursButtonRef?: RefObject<HTMLButtonElement | null>;
  onAddHours: () => void;
  onAddSchedule: () => void;
  onBack: () => void;
  onEdit: () => void;
}

const STUDENT_AVATAR_PREVIEW_COUNT = 3;

export function ClassInfoHeader({
  classData,
  addHoursButtonRef,
  onAddHours,
  onAddSchedule,
  onBack,
  onEdit,
}: ClassInfoHeaderProps) {
  const { t } = useTranslation(["classes"]);
  const data = classData.getDetailsHeaderData();
  const balanceLabel =
    data.balanceState === "no-hours"
      ? t("classes:balance.noHours")
      : data.balanceState === "all-scheduled"
        ? t("classes:balance.allScheduled")
        : data.balanceState === "exhausted"
          ? t("classes:balance.exhausted")
          : t("classDetail.availableToSchedule", {
              hours: data.formattedRemainingHours,
            });
  const balanceStatusLabel =
    data.balanceState === "available"
      ? t("classDetail.availableToScheduleLabel")
      : balanceLabel;
  const usedHours = Math.min(data.totalHours, Math.max(0, data.usedHours));
  const scheduledHours = Math.min(
    Math.max(0, data.totalHours - usedHours),
    Math.max(0, data.scheduledHours),
  );
  const availableHours = Math.max(
    0,
    data.totalHours - usedHours - scheduledHours,
  );
  const toPercentage = (hours: number) =>
    data.totalHours > 0 ? (hours / data.totalHours) * 100 : 0;

  return (
    <header className="flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_auto]">
      <nav
        aria-label={t("classDetail.breadcrumbLabel")}
        className="hidden lg:col-span-2 lg:block"
      >
        <ol className="flex items-center gap-2 text-sm text-on-surface-variant">
          <li>
            <button
              className="min-h-11 rounded-md px-1 text-left hover:text-on-surface focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35"
              onClick={onBack}
              type="button"
            >
              {t("classDetail.classes")}
            </button>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-on-surface">
            {data.displayName}
          </li>
        </ol>
      </nav>
      <button
        className="-ml-1 min-h-11 self-start rounded-md px-1 text-sm text-on-surface-variant hover:text-on-surface focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35 lg:hidden"
        onClick={onBack}
        type="button"
      >
        {t("classDetail.back")}
      </button>

      <div className="flex min-w-0 items-center gap-2 lg:col-start-1 lg:row-start-2">
        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-[-0.02em] text-on-surface sm:text-3xl">
          {data.displayName}
        </h1>
        <Button
          aria-label={t("classDetail.editClass")}
          onClick={onEdit}
          size="icon"
          type="button"
          variant="ghost"
        >
          <HugeiconsIcon
            aria-hidden="true"
            icon={PencilHugeIcon}
            strokeWidth={2}
          />
        </Button>
      </div>

      <section
        aria-label={t("classDetail.summaryLabel")}
        className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-2 lg:col-span-2 lg:grid-cols-[minmax(11rem,0.8fr)_minmax(18rem,1.5fr)_minmax(10rem,0.7fr)]"
      >
        <div className="col-span-2 min-w-0 border-b border-border p-4 sm:col-span-1 sm:border-r lg:border-b-0">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex min-h-11 w-full min-w-0 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35">
                <AvatarGroup aria-hidden="true">
                  {data.students
                    .slice(0, STUDENT_AVATAR_PREVIEW_COUNT)
                    .map((student) => (
                      <Avatar key={student.getId()} size="sm">
                        <AvatarFallback
                          className={`${nameToneAvatarClasses[getNameTone(student.getName())]} font-semibold`}
                        >
                          {student.getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  {data.students.length > STUDENT_AVATAR_PREVIEW_COUNT ? (
                    <AvatarGroupCount>
                      +{data.students.length - STUDENT_AVATAR_PREVIEW_COUNT}
                    </AvatarGroupCount>
                  ) : null}
                  {data.students.length === 0 ? (
                    <AvatarGroupCount>
                      <HugeiconsIcon
                        aria-hidden="true"
                        icon={UsersHugeIcon}
                        strokeWidth={2}
                      />
                    </AvatarGroupCount>
                  ) : null}
                </AvatarGroup>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-on-surface">
                    {t("classDetail.studentsLabel", {
                      count: data.students.length,
                    })}
                  </span>
                  <span className="block truncate text-xs text-on-surface-variant">
                    {data.students.length
                      ? t("classDetail.viewStudents")
                      : t("classes:noStudents")}
                  </span>
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="max-h-72 overflow-y-auto p-3"
            >
              <p className="px-1 pb-2 text-sm font-medium text-on-surface">
                {t("classDetail.studentsLabel", {
                  count: data.students.length,
                })}
              </p>
              {data.students.length ? (
                <ul className="flex flex-col gap-1" role="list">
                  {data.students.map((student) => (
                    <li
                      className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1.5"
                      key={student.getId()}
                    >
                      <Avatar size="sm">
                        <AvatarFallback
                          className={`${nameToneAvatarClasses[getNameTone(student.getName())]} font-semibold`}
                        >
                          {student.getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm text-on-surface">
                        {student.getName()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-1 py-2 text-sm text-on-surface-variant">
                  {t("classes:noStudents")}
                </p>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="min-w-0 border-b border-border p-4 lg:border-b-0 lg:border-r">
          <div className="min-w-0">
            <p className="text-xs font-medium text-on-surface-variant">
              {balanceStatusLabel}
            </p>
            {data.balanceState === "available" ? (
              <p className="mt-1 text-xl font-semibold tabular-nums text-on-surface">
                {t("classDetail.availableHoursValue", {
                  hours: data.formattedRemainingHours,
                })}
              </p>
            ) : (
              <p className="mt-1 text-sm font-semibold leading-5 text-on-surface">
                {balanceLabel}
              </p>
            )}
            <p className="mt-1 text-xs tabular-nums text-on-surface-variant">
              {t("classes:balance.total", { hours: data.formattedTotalHours })}
            </p>
          </div>
          <div
            aria-label={t("classDetail.hoursMeterLabel")}
            aria-valuemax={data.totalHours}
            aria-valuemin={0}
            aria-valuenow={usedHours}
            aria-valuetext={t("classDetail.hoursMeterValue", {
              total: data.formattedTotalHours,
              used: data.formattedUsedHours,
              scheduled: data.formattedScheduledHours,
              available: data.formattedRemainingHours,
            })}
            className="mt-3 flex h-2 overflow-hidden rounded-full bg-surface-container-low"
            role="progressbar"
          >
            <span
              className="bg-inverse"
              style={{ width: `${toPercentage(usedHours)}%` }}
            />
            <span
              className="bg-info"
              style={{ width: `${toPercentage(scheduledHours)}%` }}
            />
            <span
              className="bg-primary-container"
              style={{ width: `${toPercentage(availableHours)}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-inverse"
              />
              {t("classDetail.usedHours", { hours: data.formattedUsedHours })}
            </span>
            <span className="inline-flex items-center gap-1">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-info"
              />
              {t("classDetail.scheduledHours", {
                hours: data.formattedScheduledHours,
              })}
            </span>
            <span className="inline-flex items-center gap-1">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-primary-container"
              />
              {t("classDetail.availableHours", {
                hours: data.formattedRemainingHours,
              })}
            </span>
          </div>
        </div>

        <div className="min-w-0 border-l border-border p-4 sm:border-l-0 lg:border-l-0">
          <p className="text-xs font-medium text-on-surface-variant">
            {t("classes:revenue.label")}
          </p>
          <p className="mt-1 truncate text-base font-semibold tabular-nums text-on-surface sm:text-lg">
            {data.formattedRecordedRevenue ?? t("classes:revenue.notRecorded")}
          </p>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-2 lg:col-start-2 lg:row-start-2 lg:flex">
        <Button
          className="w-full lg:w-auto"
          leftIcon={AddHugeIcon}
          onClick={onAddHours}
          ref={addHoursButtonRef}
          type="button"
          variant="outline"
        >
          {t("classes:hourAdditions.addAction")}
        </Button>
        <Button
          className="w-full lg:w-auto"
          leftIcon={CalendarHugeIcon}
          onClick={onAddSchedule}
          type="button"
        >
          {t("classDetail.addSchedule")}
        </Button>
      </div>
    </header>
  );
}
