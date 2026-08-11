import { ChevronRight, Clock3, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useRef } from "react";
import type { KeyboardEvent } from "react";
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
	const balanceLabel =
		data.balanceState === "no-hours"
			? t("classes:balance.noHours")
			: data.balanceState === "exhausted"
				? t("classes:balance.exhausted")
				: t("classes:balance.remaining", {
					hours: data.formattedRemainingHours,
				});

	return (
		<li className="scroll-mt-28 md:scroll-mt-32">
			<div className="flex min-h-20 items-center gap-3 rounded-lg border border-border bg-card px-4 py-4 transition-colors motion-reduce:transition-none hover:bg-surface focus-within:bg-surface">
				<Button
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
						<p className="mt-1 truncate text-sm text-muted-foreground">
							{data.studentNames.length > 0
								? data.studentNames.join(", ")
								: t("classes:noStudents")}
						</p>
						<div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:hidden">
							<span
								className={cn(
									"font-medium",
									data.balanceState === "exhausted" && "text-warning",
								)}
							>
								{balanceLabel}
							</span>
							<span className="text-muted-foreground">
								{t("classes:balance.total", {
									hours: data.formattedTotalHours,
								})}
							</span>
						</div>
					</div>
					<div className="hidden shrink-0 text-right sm:block">
						<p
							className={cn(
								"font-medium tabular-nums",
								data.balanceState === "exhausted" && "text-warning",
							)}
						>
							{balanceLabel}
						</p>
						<p className="mt-1 text-xs text-muted-foreground tabular-nums">
							{t("classes:balance.total", {
								hours: data.formattedTotalHours,
							})}
						</p>
					</div>
				</Button>
				<Button
					className="hidden shrink-0 sm:inline-flex"
					leftIcon={Clock3}
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
								onKeyDown={handleButtonKeyDown}
								ref={setActionTriggerRef}
								size="icon"
								type="button"
								variant="ghost"
							/>
						}
					>
						<MoreVertical aria-hidden="true" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuGroup className="sm:hidden">
							<DropdownMenuItem
								onClick={() => onAddHours(actionButtonRef.current)}
							>
								<Plus />
								{t("classes:hourAdditions.addAction")}
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator className="sm:hidden" />
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={onOpen}>
								<ChevronRight />
								{t("classes:view")}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onEdit}>
								<Pencil />
								{t("classes:editClass")}
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={onDelete} variant="destructive">
								<Trash2 />
								{t("classes:delete.deleteClass")}
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</li>
	);
}
