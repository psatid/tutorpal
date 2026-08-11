import { Clock, Edit3, MoreVertical, Trash2 } from "lucide-react";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Course } from "@/models/course";

interface CourseRowProps {
	actionTriggerRef: Ref<HTMLButtonElement>;
	course: Course;
	onDelete: () => void;
	onEdit: () => void;
}

export function CourseRow({
	actionTriggerRef,
	course,
	onDelete,
	onEdit,
}: CourseRowProps) {
	const { t } = useTranslation(["courses"]);
	const data = course.getListItemData();

	return (
		<li className="scroll-mt-28 md:scroll-mt-32">
			<div className="flex min-h-20 items-center gap-3 border-border bg-card px-4 py-4 transition-colors motion-reduce:transition-none hover:bg-surface focus-within:bg-surface">
				<div className="min-w-0 flex-1">
					<p className="truncate font-semibold text-foreground">{data.name}</p>
					<p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
						<Clock aria-hidden="true" className="size-4" />
						{t("courses:defaultHours", {
							hours: data.formattedDefaultTotalHours,
						})}
					</p>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								aria-label={t("courses:actionsFor", { name: data.name })}
								ref={actionTriggerRef}
								size="icon"
								type="button"
								variant="ghost"
							/>
						}
					>
						<MoreVertical aria-hidden="true" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={onEdit}>
								<Edit3 />
								{t("courses:editCourse")}
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={onDelete} variant="destructive">
								<Trash2 />
								{t("courses:deleteCourse")}
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</li>
	);
}
