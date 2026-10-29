import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon as ChevronRightHugeIcon,
  Clock03Icon as Clock3HugeIcon,
  MoreVerticalIcon as MoreVerticalHugeIcon,
  PencilEdit01Icon as PencilHugeIcon,
  Add01Icon as PlusHugeIcon,
  Delete02Icon as Trash2HugeIcon,
} from "@hugeicons/core-free-icons";
import { useCallback, useId, useRef } from "react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
} from "@tutorpal/ui/avatar";
import { Button } from "@tutorpal/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@tutorpal/ui/dropdown-menu";
import { DateTime } from "@/lib/date-time";
import { getNameTone, nameToneAvatarClasses } from "@/lib/name-tone";
import { cn } from "@/lib/utils";
import { Class } from "@/models/class";

export function ClassRow({
	item,
	onAddHours,
	onDelete,
	onEdit,
	onOpen,
	actionTriggerRef,
}: {
	item: Class;
	onAddHours: (trigger: HTMLButtonElement | null) => void;
	onDelete: () => void;
	onEdit: () => void;
	onOpen: () => void;
	actionTriggerRef: (node: HTMLButtonElement | null) => void;
}) {
	const { t } = useTranslation(["classes"]);
	const data = item.getListItemData();
	const students = item.getStudents();
	const displayedStudents = students.slice(0, 3);
	const remainingStudents = students.length - displayedStudents.length;
	const studentDescriptionId = useId();
	const actionButtonRef = useRef<HTMLButtonElement>(null);
	const addHoursButtonRef = useRef<HTMLButtonElement>(null);
	const setActionTriggerRef = useCallback(
		(node: HTMLButtonElement | null) => {
			actionButtonRef.current = node;
			actionTriggerRef(node);
		},
		[actionTriggerRef],
	);
	const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (
			!event.defaultPrevented &&
			(event.key === "Enter" || event.key === " ")
		) {
			event.preventDefault();
			event.currentTarget.click();
		}
	};
	const hoursLeft = Math.max(data.totalHours - data.usedHours, 0);
	const roundedHoursLeft = Math.round((hoursLeft + Number.EPSILON) * 100) / 100;
	const hasNoHours = data.totalHours <= 0;
	const hoursLeftLabel =
		hasNoHours
			? t("classes:balance.noHours")
			: t("classes:hoursLeft", {
					count: roundedHoursLeft,
					hours: DateTime.formatDurationHours(roundedHoursLeft),
				});
	const rowDescription = [data.studentNames.join(", "), hoursLeftLabel]
		.filter(Boolean)
		.join(". ");

	return (
		<li className="scroll-mt-28 md:scroll-mt-32">
			<div className="flex min-h-20 items-center gap-3 rounded-lg border border-border bg-card px-4 py-4 transition-colors motion-reduce:transition-none hover:bg-surface focus-within:bg-surface">
				<Button
					aria-describedby={studentDescriptionId}
					aria-label={t("classes:viewDetailsFor", { name: data.displayName })}
					className="group h-auto min-h-11 min-w-0 flex-1 justify-start gap-3 rounded-lg px-0 py-0 text-left hover:bg-transparent focus-visible:ring-offset-2"
					onClick={onOpen}
					onKeyDown={handleButtonKeyDown}
					type="button"
					variant="ghost"
				>
					<div className="min-w-0 flex-1">
						<p className="max-w-full truncate font-semibold text-foreground">
							{data.displayName}
						</p>
						<span className="sr-only" id={studentDescriptionId}>
							{rowDescription}
						</span>
						{students.length > 0 ? (
							<>
								<AvatarGroup aria-hidden="true" className="mt-2">
									{displayedStudents.map((student) => (
										<Avatar key={student.getId()} size="sm">
											<AvatarFallback
												className={`${nameToneAvatarClasses[getNameTone(student.getName())]} font-semibold`}
											>
												{student.getInitials()}
											</AvatarFallback>
										</Avatar>
									))}
									{remainingStudents > 0 ? (
										<AvatarGroupCount>+{remainingStudents}</AvatarGroupCount>
									) : null}
								</AvatarGroup>
							</>
						) : null}
						<p
							className={cn(
								"mt-2 break-words whitespace-normal font-medium text-foreground tabular-nums sm:hidden",
								hasNoHours && "text-muted-foreground",
							)}
						>
							{hoursLeftLabel}
						</p>
					</div>
					<p
						className={cn(
							"hidden shrink-0 text-right font-medium text-foreground tabular-nums sm:block",
							hasNoHours && "text-muted-foreground",
						)}
					>
						{hoursLeftLabel}
					</p>
				</Button>
				<Button
					className="hidden shrink-0 sm:inline-flex"
					leftIcon={Clock3HugeIcon}
					onClick={() => onAddHours(addHoursButtonRef.current)}
					ref={addHoursButtonRef}
					size="sm"
					type="button"
					variant="outline"
				>
					{t("classes:hourAdditions.addAction")}
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								aria-label={t("classes:actionsFor", { name: data.displayName })}
								className="self-start"
								onKeyDown={handleButtonKeyDown}
								ref={setActionTriggerRef}
								size="icon"
								type="button"
								variant="ghost"
							/>
						}
					>
						<HugeiconsIcon icon={MoreVerticalHugeIcon} strokeWidth={2} aria-hidden="true" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuGroup className="sm:hidden">
							<DropdownMenuItem
								onClick={() => onAddHours(actionButtonRef.current)}
							>
								<HugeiconsIcon icon={PlusHugeIcon} strokeWidth={2} aria-hidden="true" />
								{t("classes:hourAdditions.addAction")}
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator className="sm:hidden" />
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={onOpen}>
								<HugeiconsIcon icon={ChevronRightHugeIcon} strokeWidth={2} aria-hidden="true" />
								{t("classes:view")}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onEdit}>
								<HugeiconsIcon icon={PencilHugeIcon} strokeWidth={2} aria-hidden="true" />
								{t("classes:editClass")}
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={onDelete} variant="destructive">
								<HugeiconsIcon icon={Trash2HugeIcon} strokeWidth={2} aria-hidden="true" />
								{t("classes:delete.deleteClass")}
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</li>
	);
}
