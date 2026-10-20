import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon as AlertTriangleHugeIcon,
  ArrowLeft01Icon as ArrowLeftHugeIcon,
  Clock03Icon as Clock3HugeIcon,
  PencilEdit01Icon as PencilHugeIcon,
  UserGroupIcon as UsersRoundHugeIcon,
} from "@hugeicons/core-free-icons";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/common/avatar";
import { Button } from "@/components/common/button";
import { cn } from "@/lib/utils";
import { Class } from "@/models/class";
import { getNameTone, nameToneAvatarClasses } from "@/lib/name-tone";

interface ClassInfoHeaderProps {
	classData: Class;
	addHoursButtonRef?: RefObject<HTMLButtonElement | null>;
	onAddHours: () => void;
	onBack: () => void;
	onEdit: () => void;
}

export function ClassInfoHeader({
	classData,
	addHoursButtonRef,
	onAddHours,
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
				: t("classes:balance.available", {
					hours: data.formattedRemainingHours,
				});
	const balanceProgress =
		data.totalHours > 0
			? Math.min(
					100,
					Math.max(0, (data.usedHours / data.totalHours) * 100),
				)
			: null;
	const usedHoursForProgress = Math.min(
		data.totalHours,
		Math.max(0, data.usedHours),
	);
	const BalanceIcon =
		data.balanceState === "exhausted" ? AlertTriangleHugeIcon : Clock3HugeIcon;

	return (
		<header className="rounded-xl border border-border bg-card p-4 sm:p-5">
			<div className="flex min-w-0 items-center gap-3">
				<button
					aria-label={t("classDetail.back")}
					className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35"
					onClick={onBack}
					type="button"
				>
					<HugeiconsIcon icon={ArrowLeftHugeIcon} strokeWidth={2} aria-hidden="true" className="size-5 text-on-surface" />
				</button>
				<div className="flex min-w-0 items-center gap-1">
					<h1 className="min-w-0 truncate text-xl font-medium leading-tight tracking-[-0.01em] text-on-surface sm:text-2xl">
						{data.displayName}
					</h1>
					<Button
						aria-label={t("classDetail.editClass")}
						className="size-11 shrink-0"
						onClick={onEdit}
						size="icon"
						type="button"
						variant="ghost"
					>
						<HugeiconsIcon icon={PencilHugeIcon} strokeWidth={2} aria-hidden="true" className="size-4" />
					</Button>
				</div>
			</div>
			<div className="mt-5 grid gap-5 border-t border-border pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.65fr)] lg:gap-8">
				<section aria-labelledby="class-students-title" className="min-w-0">
					<div className="flex items-center gap-2">
						<HugeiconsIcon icon={UsersRoundHugeIcon} strokeWidth={2} aria-hidden="true" className="size-4 text-on-surface-variant" />
						<h2
							className="text-sm font-medium text-on-surface"
							id="class-students-title"
						>
							{t("classDetail.studentsLabel", {
								count: data.students.length,
							})}
						</h2>
					</div>
					{data.students.length > 0 ? (
						<ul className="mt-3 flex flex-wrap gap-2" role="list">
							{data.students.map((student) => (
								<li
									className="flex min-h-8 items-center gap-2 rounded-full bg-surface-container-low py-1 pr-3 pl-1"
									key={student.getId()}
								>
									<Avatar size="sm">
										<AvatarFallback className={`${nameToneAvatarClasses[getNameTone(student.getName())]} text-xs font-semibold`}>
											{student.getInitials()}
										</AvatarFallback>
									</Avatar>
									<span className="max-w-40 truncate text-sm text-on-surface">
										{student.getName()}
									</span>
								</li>
							))}
						</ul>
					) : (
						<p className="mt-3 text-sm text-on-surface-variant">
							{t("classes:noStudents")}
						</p>
					)}
				</section>

				<section aria-labelledby="class-balance-title" className="rounded-lg bg-inverse p-4">
					<div className="flex items-center justify-between gap-3">
						<p
							className="text-xs font-medium uppercase tracking-[0.12em] text-inverse-foreground/70"
							id="class-balance-title"
						>
							{t("classes:balance.label")}
						</p>
						<HugeiconsIcon
							aria-hidden="true"
							className={cn(
								"size-4",
								data.balanceState === "exhausted"
									? "text-warning-container"
									: "text-inverse-foreground/75",
							)}
							icon={BalanceIcon}
							strokeWidth={2}
						/>
					</div>
					<p
						className={cn(
							"mt-2 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-inverse-foreground",
							data.balanceState === "exhausted" && "text-warning-container",
						)}
					>
						{balanceLabel}
					</p>
					<p className="mt-1 text-sm text-inverse-foreground/70 tabular-nums">
						{t("classes:balance.total", {
							hours: data.formattedTotalHours,
						})}
					</p>
					<div className="mt-4 border-t border-inverse-foreground/20 pt-4">
						<p className="text-sm tabular-nums text-inverse-foreground">
							{t("classes:balance.accounting", {
								scheduled: data.formattedScheduledHours,
								used: data.formattedUsedHours,
							})}
						</p>
					</div>
					{balanceProgress !== null ? (
						<div
							aria-label={t("classes:balance.usedProgressLabel")}
							aria-valuemax={data.totalHours}
							aria-valuemin={0}
							aria-valuenow={usedHoursForProgress}
							aria-valuetext={t("classes:balance.usedProgress", {
								used: data.formattedUsedHours,
								total: data.formattedTotalHours,
							})}
							className="mt-3 h-1.5 overflow-hidden rounded-full bg-inverse-foreground/20"
							role="progressbar"
						>
							<span
								className={cn(
									"block h-full rounded-full bg-primary-container transition-[width]",
									data.balanceState === "all-scheduled" && "bg-info",
									data.balanceState === "exhausted" && "bg-warning-container",
								)}
								style={{ width: `${balanceProgress}%` }}
							/>
						</div>
					) : null}
					<div className="mt-4 border-t border-inverse-foreground/20 pt-4">
						<p className="text-xs font-medium uppercase tracking-[0.12em] text-inverse-foreground/70">
							{t("classes:revenue.label")}
						</p>
						<p className="mt-1 text-lg font-semibold tabular-nums text-inverse-foreground">
							{data.formattedRecordedRevenue ??
								t("classes:revenue.notRecorded")}
						</p>
					</div>
					<Button
						className="mt-4 w-full sm:w-auto"
						leftIcon={Clock3HugeIcon}
						onClick={onAddHours}
						ref={addHoursButtonRef}
						type="button"
					>
						{t("classes:hourAdditions.addAction")}
					</Button>
				</section>
			</div>
		</header>
	);
}
