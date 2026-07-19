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
		<div className="bg-card border border-outline-variant rounded-xl p-4 space-y-4">
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={onBack}
					className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
					aria-label={t("classDetail.back")}
				>
					<ArrowLeft className="w-5 h-5 text-on-surface" />
				</button>

				<div className="flex-1 min-w-0">
					<h1 className="font-headline font-bold text-xl text-on-surface truncate">
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
