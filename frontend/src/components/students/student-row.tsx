import {
	CheckCircle2,
	ChevronRight,
	Eye,
	Link2,
	MessageSquare,
	MoreVertical,
	Phone,
	Trash2,
	TriangleAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GetV1Students200DataItem } from "@/api/generated/models/getV1Students200DataItem";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StudentRowProps {
	student: GetV1Students200DataItem;
	onView: () => void;
	onDelete: () => void;
	onLinkLine: () => void;
	onSendTestMessage: () => void;
}

export function StudentRow({
	student,
	onView,
	onDelete,
	onLinkLine,
	onSendTestMessage,
}: StudentRowProps) {
	const { t } = useTranslation(["students"]);
	const linked = student.lineLinkStatus === "linked";
	const needsRelink = student.lineLinkStatus === "needs_relink";
	const initials = student.name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<div className="group flex min-h-20 items-center gap-3 border-b border-border py-4 last:border-0">
			<button
				className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
				onClick={onView}
				type="button"
			>
				<Avatar size="lg">
					<AvatarFallback className="bg-primary/10 font-semibold text-primary">
						{initials}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1">
					<div className="flex min-w-0 flex-wrap items-center gap-2">
						<p className="truncate font-semibold text-foreground">
							{student.name}
						</p>
						<Badge variant="outline">
							{t("students:grade", { grade: student.grade })}
						</Badge>
						{linked ? (
							<Badge
								className="gap-1 border-emerald-600/30 text-emerald-700"
								variant="outline"
							>
								<CheckCircle2 />
								LINE
							</Badge>
						) : null}
						{needsRelink ? (
							<Badge
								className="gap-1 border-amber-600/30 text-amber-700"
								variant="outline"
							>
								<TriangleAlert />
								{t("students:line.needsRelink")}
							</Badge>
						) : null}
					</div>
					<p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
						<Phone className="size-4" />
						{student.phoneNumber ?? t("students:noPhone")}
					</p>
				</div>
				<ChevronRight className="hidden size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none sm:block" />
			</button>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label={t("students:actionsFor", { name: student.name })}
							size="icon"
							variant="ghost"
						/>
					}
				>
					<MoreVertical />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={onView}>
							<Eye />
							{t("students:view")}
						</DropdownMenuItem>
						{!linked ? (
							<DropdownMenuItem onClick={onLinkLine}>
								<Link2 />
								{t(
									needsRelink
										? "students:line.relinkLabel"
										: "students:line.linkLabel",
								)}
							</DropdownMenuItem>
						) : null}
						{linked ? (
							<DropdownMenuItem onClick={onSendTestMessage}>
								<MessageSquare />
								{t("students:line.testMessage")}
							</DropdownMenuItem>
						) : null}
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={onDelete} variant="destructive">
							<Trash2 />
							{t("students:delete.confirmButton")}
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
