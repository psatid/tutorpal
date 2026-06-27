import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Pencil, ArrowLeft } from "lucide-react";
import { getInitials } from "@/lib/name";
import type { GetV1ClassesById200 } from "@/api/generated/models/getV1ClassesById200";

interface ClassInfoHeaderProps {
	classData: GetV1ClassesById200;
	onBack: () => void;
	onEdit: () => void;
}

function formatHours(hours: number) {
	return new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(hours);
}

export function ClassInfoHeader({
	classData,
	onBack,
	onEdit,
}: ClassInfoHeaderProps) {
	const { t } = useTranslation(["classes"]);

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
						{classData.name}
					</h1>
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
					{classData.remainingHours !== undefined
						? t("classes:hoursWithRemaining", {
								total: formatHours(classData.totalHours),
								remaining: formatHours(classData.remainingHours),
							})
						: t("classes:hours", { hours: formatHours(classData.totalHours) })}
				</Badge>

				{classData.students.length > 0 && (
					<div className="flex items-center gap-2">
						<AvatarGroup className="shrink-0">
							{classData.students.slice(0, 4).map((student) => (
								<Avatar key={student.id} size="sm">
									<AvatarFallback className="bg-accent text-on-primary-container font-semibold text-xs">
										{getInitials(student.name)}
									</AvatarFallback>
								</Avatar>
							))}
							{classData.students.length > 4 && (
								<span className="text-xs text-on-surface-variant ml-1">
									+{classData.students.length - 4}
								</span>
							)}
						</AvatarGroup>
						<span className="text-sm text-on-surface-variant">
							{t("classes:students", { count: classData.students.length })}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
