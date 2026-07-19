import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InfoCard } from "@/components/ui/info-card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, Eye, MoreVertical, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Class } from "@/models/class";

interface ClassCardProps {
	classData: Class;
	onView: () => void;
	onDelete: () => void;
}

export function ClassCard({ classData, onView, onDelete }: ClassCardProps) {
	const { t } = useTranslation(["classes"]);
	const data = classData.getDetailsHeaderData();
	const displayedStudents = data.students.slice(0, 3);
	const remainingStudents = data.students.length - 3;

	return (
		<InfoCard onClick={onView}>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<p className="font-medium text-on-surface truncate">
						{data.displayName}
					</p>
					<Badge variant="outline" className="shrink-0">
						{data.courseName ?? "Custom class"}
					</Badge>
					<Badge variant="outline" className="shrink-0 gap-1">
						<Clock className="w-3 h-3" />
						{data.remainingHours !== undefined
							? t("classes:hoursWithRemaining", {
									total: data.formattedTotalHours,
									remaining: data.formattedRemainingHours,
								})
							: t("classes:hours", {
									hours: data.formattedTotalHours,
								})}
					</Badge>
					<AvatarGroup className="shrink-0">
						{displayedStudents.map((student) => (
							<Avatar key={student.getId()} size="sm">
								<AvatarFallback className="bg-accent text-on-primary-container font-semibold">
									{student.getInitials()}
								</AvatarFallback>
							</Avatar>
						))}
						{remainingStudents > 0 && (
							<AvatarGroupCount>+{remainingStudents}</AvatarGroupCount>
						)}
					</AvatarGroup>
					<span className="text-sm text-on-surface-variant shrink-0">
						{t("classes:students", { count: data.students.length })}
					</span>
				</div>
			</div>

			<DropdownMenu>
				<DropdownMenuTrigger
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
					}}
				>
					<MoreVertical className="w-4 h-4 text-on-surface-variant" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={onView}>
						<Eye className="w-4 h-4" />
						{t("classes:view")}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem variant="destructive" onClick={onDelete}>
						<Trash2 className="w-4 h-4" />
						{t("classes:delete.confirmButton")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</InfoCard>
	);
}
