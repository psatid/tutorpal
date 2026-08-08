import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Pencil, ArrowLeft } from "lucide-react";
import { Class } from "@/models/class";

interface ClassInfoHeaderProps {
	classData: Class;
	onBack: () => void;
	onEdit: () => void;
}

export function ClassInfoHeader({
	classData,
	onBack,
	onEdit,
}: ClassInfoHeaderProps) {
	const { t } = useTranslation(["classes"]);
	const data = classData.getDetailsHeaderData();

  return (
		<div className="space-y-4 rounded-lg border border-border bg-card p-4">
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={onBack}
					className="-ml-2 inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35"
					aria-label={t("classDetail.back")}
				>
					<ArrowLeft className="w-5 h-5 text-on-surface" />
				</button>

				<div className="flex-1 min-w-0">
					<h1 className="truncate font-headline text-xl font-medium tracking-[-0.01em] text-on-surface">
						{data.displayName}
					</h1>
					<p className="truncate text-sm text-on-surface-variant">
						{data.courseName ?? "Custom class"}
					</p>
				</div>

				<Button
					variant="ghost"
					size="icon"
					onClick={onEdit}
					aria-label={t("classDetail.editClass")}
				>
					<Pencil className="w-4 h-4" />
				</Button>
			</div>

			<div className="flex items-center gap-3 flex-wrap">
				<Badge variant="outline" className="gap-1">
					<Clock className="w-3 h-3" />
					{data.remainingHours !== undefined
						? t("classes:hoursWithRemaining", {
								total: data.formattedTotalHours,
								remaining: data.formattedRemainingHours,
							})
						: t("classes:hours", { hours: data.formattedTotalHours })}
				</Badge>

				{data.students.length > 0 && (
					<div className="flex items-center gap-2">
						<AvatarGroup className="shrink-0">
							{data.students.slice(0, 4).map((student) => (
								<Avatar key={student.getId()} size="sm">
									<AvatarFallback className="bg-accent text-on-primary-container font-semibold text-xs">
									{student.getInitials()}
									</AvatarFallback>
								</Avatar>
							))}
							{data.students.length > 4 && (
								<span className="text-xs text-on-surface-variant ml-1">
									+{data.students.length - 4}
								</span>
							)}
						</AvatarGroup>
						<span className="text-sm text-on-surface-variant">
							{t("classes:students", { count: data.students.length })}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
