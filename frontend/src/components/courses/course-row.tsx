import { Edit3, MoreVertical, Trash2 } from "lucide-react";
import type { Ref } from "react";
import { Link } from "@tanstack/react-router";
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
import { APP_ROUTES } from "@/constants/routes";
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
	const metadata =
		data.formattedPriceAmount === null
			? t("courses:courseMetadataUnpriced", {
					hours: data.formattedDefaultTotalHours,
				})
			: data.pricingMode === "hourly_rate"
				? t("courses:courseMetadataHourly", {
						hours: data.formattedDefaultTotalHours,
						price: data.formattedPriceAmount,
					})
				: t("courses:courseMetadataFixed", {
						hours: data.formattedDefaultTotalHours,
						price: data.formattedPriceAmount,
					});

	return (
		<li className="scroll-mt-28 md:scroll-mt-32">
			<div className="flex min-h-20 items-center gap-3 border-border bg-card px-4 py-4 transition-colors motion-reduce:transition-none hover:bg-surface focus-within:bg-surface">
				<Link
					className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35"
					params={{ courseId: data.id }}
					preload="intent"
					to={APP_ROUTES.COURSE_DETAIL}
				>
					<p className="truncate font-semibold text-foreground">{data.name}</p>
					<p className="mt-1 text-sm text-muted-foreground">{metadata}</p>
				</Link>
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
