import { AlertTriangle, ArrowLeft, Clock3, Pencil, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Class } from "@/models/class";

interface ClassInfoHeaderProps {
	classData: Class;
	onAddHours: () => void;
	onBack: () => void;
	onEdit: () => void;
}

export function ClassInfoHeader({
	classData,
	onAddHours,
	onBack,
	onEdit,
}: ClassInfoHeaderProps) {
	const { t } = useTranslation(["classes"]);
	const data = classData.getDetailsHeaderData();
	const balanceLabel =
		data.balanceState === "no-hours"
			? t("classes:balance.noHours")
			: data.balanceState === "exhausted"
				? t("classes:balance.exhausted")
				: t("classes:balance.remaining", {
					hours: data.formattedRemainingHours,
				});
	const balanceProgress =
		data.totalHours > 0
			? Math.min(
					100,
					Math.max(0, (data.remainingHours / data.totalHours) * 100),
				)
			: null;
	const BalanceIcon =
		data.balanceState === "exhausted" ? AlertTriangle : Clock3;

	return (
		<header className="rounded-xl border border-border bg-card p-4 sm:p-5">
			<div className="flex items-center gap-3">
				<button
					aria-label={t("classDetail.back")}
					className="-ml-2 inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35"
					onClick={onBack}
					type="button"
				>
					<ArrowLeft aria-hidden="true" className="size-5 text-on-surface" />
				</button>
				<div className="min-w-0 flex-1">
					<h1 className="break-words text-xl font-medium leading-tight tracking-[-0.01em] text-on-surface sm:text-2xl">
						{data.displayName}
					</h1>
				</div>
				<Button
					aria-label={t("classDetail.editClass")}
					onClick={onEdit}
					size="icon"
					type="button"
					variant="ghost"
				>
					<Pencil aria-hidden="true" className="size-4" />
				</Button>
			</div>
			<div className="mt-5 grid gap-5 border-t border-border pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.65fr)] lg:gap-8">
				<section aria-labelledby="class-students-title" className="min-w-0">
					<div className="flex items-center gap-2">
						<UsersRound aria-hidden="true" className="size-4 text-on-surface-variant" />
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
										<AvatarFallback className="bg-accent text-xs font-semibold text-on-primary-container">
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

				<section aria-labelledby="class-balance-title" className="rounded-lg bg-overlay-navy p-4">
					<div className="flex items-center justify-between gap-3">
						<p
							className="text-xs font-medium uppercase tracking-[0.12em] text-white/70"
							id="class-balance-title"
						>
							{t("classes:balance.label")}
						</p>
						<BalanceIcon
							aria-hidden="true"
							className={cn(
								"size-4",
								data.balanceState === "exhausted"
									? "text-warning-container"
									: "text-white/75",
							)}
						/>
					</div>
					<p
						className={cn(
							"mt-2 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-white",
							data.balanceState === "exhausted" && "text-warning-container",
						)}
					>
						{balanceLabel}
					</p>
					<p className="mt-1 text-sm text-white/70 tabular-nums">
						{t("classes:balance.total", {
							hours: data.formattedTotalHours,
						})}
					</p>
					{balanceProgress !== null ? (
						<div
							aria-label={t("classes:balance.label")}
							aria-valuemax={100}
							aria-valuemin={0}
							aria-valuenow={Math.round(balanceProgress)}
							aria-valuetext={balanceLabel}
							className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20"
							role="progressbar"
						>
							<span
								className={cn(
									"block h-full rounded-full bg-primary-container transition-[width]",
									data.balanceState === "exhausted" && "bg-warning-container",
								)}
								style={{ width: `${balanceProgress}%` }}
							/>
						</div>
					) : null}
					<Button
						className="mt-4 w-full sm:w-auto"
						leftIcon={Clock3}
						onClick={onAddHours}
						type="button"
					>
						{t("classes:hourAdditions.addAction")}
					</Button>
				</section>
			</div>
		</header>
	);
}
