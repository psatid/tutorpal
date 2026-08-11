import { ArrowLeft, Clock3, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
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

	return (
		<header className="space-y-4 rounded-lg border border-border bg-card p-4">
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
					<h1 className="truncate text-xl font-medium tracking-[-0.01em] text-on-surface">
						{data.displayName}
					</h1>
					{data.students.length > 0 ? (
						<div className="mt-1 flex min-w-0 items-center gap-2">
							<AvatarGroup className="shrink-0">
								{data.students.slice(0, 4).map((student) => (
									<Avatar key={student.getId()} size="sm">
										<AvatarFallback className="bg-accent text-xs font-semibold text-on-primary-container">
											{student.getInitials()}
										</AvatarFallback>
									</Avatar>
								))}
							</AvatarGroup>
							<span className="truncate text-sm text-on-surface-variant">
								{t("classes:students", { count: data.students.length })}
							</span>
						</div>
					) : (
						<p className="mt-1 text-sm text-on-surface-variant">
							{t("classes:noStudents")}
						</p>
					)}
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
			<div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<p className="text-sm text-muted-foreground">
						{t("classes:balance.label")}
					</p>
					<p
						className={cn(
							"mt-1 font-medium tabular-nums text-foreground",
							data.balanceState === "exhausted" && "text-warning",
						)}
					>
						{balanceLabel}
					</p>
					<p className="mt-1 text-sm text-muted-foreground tabular-nums">
						{t("classes:balance.total", {
							hours: data.formattedTotalHours,
						})}
					</p>
				</div>
				<Button
					className="w-full sm:w-auto"
					leftIcon={Clock3}
					onClick={onAddHours}
					type="button"
				>
					{t("classes:hourAdditions.addAction")}
				</Button>
			</div>
		</header>
	);
}
