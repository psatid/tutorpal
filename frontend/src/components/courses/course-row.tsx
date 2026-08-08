import {
	BookOpen,
	ChevronRight,
	Clock,
	Edit3,
	MoreVertical,
	Trash2,
} from "lucide-react";
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
	onViewClasses: () => void;
}

export function CourseRow({
	actionTriggerRef,
	course,
	onDelete,
	onEdit,
	onViewClasses,
}: CourseRowProps) {
	const { t } = useTranslation(["courses"]);
	const data = course.getListItemData();

	return (
		<div className="flex min-h-20 items-center gap-3 border-b border-border py-4 last:border-0">
			<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
				<BookOpen className="size-5" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate font-semibold text-foreground">{data.name}</p>
				<p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
					<Clock className="size-4" />
					{t("courses:defaultHours", {
						hours: data.formattedDefaultTotalHours,
					})}
				</p>
			</div>
			<Button
				className="hidden shrink-0 sm:inline-flex"
				onClick={onViewClasses}
				variant="ghost"
			>
				{t("courses:classCount", { count: data.classCount })}
				<ChevronRight data-icon="inline-end" />
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label={t("courses:actionsFor", { name: data.name })}
							onKeyDown={(event) => {
								if (
									!event.defaultPrevented &&
									(event.key === "Enter" || event.key === " ")
								) {
									event.preventDefault();
									event.currentTarget.click();
								}
							}}
							ref={actionTriggerRef}
							size="icon"
							variant="ghost"
						/>
					}
				>
					<MoreVertical />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={onViewClasses}>
							<ChevronRight />
							{t("courses:viewClasses", { count: data.classCount })}
						</DropdownMenuItem>
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
	);
}
