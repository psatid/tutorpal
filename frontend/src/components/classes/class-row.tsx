import { ChevronRight, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GetV1Classes200DataItem } from "@/api/generated/models/getV1Classes200DataItem";
import { Badge } from "@/components/ui/badge";

function formatHours(value: number) {
	return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
		value,
	);
}

export function ClassRow({
	item,
	onOpen,
}: {
	item: GetV1Classes200DataItem;
	onOpen: () => void;
}) {
	const { t } = useTranslation(["classes"]);
	return (
		<button
			className="group flex min-h-20 w-full items-center gap-3 border-b border-border py-4 text-left last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
			onClick={onOpen}
			type="button"
		>
			<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
				<Users aria-hidden="true" />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex min-w-0 flex-wrap items-center gap-2">
					<p className="max-w-full truncate font-semibold text-foreground">
						{item.displayName}
					</p>
					<Badge className="max-w-full truncate" variant="outline">
						{item.course?.name ?? t("classes:customClass")}
					</Badge>
				</div>
				<p className="mt-1 truncate text-sm text-muted-foreground">
					{item.students.map((student) => student.name).join(", ")}
				</p>
			</div>
			<div className="hidden shrink-0 text-right sm:block">
				<p className="font-medium tabular-nums">
					{t("classes:hoursLeft", {
						hours: formatHours(item.remainingHours ?? item.totalHours),
					})}
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{t("classes:hoursTotal", { hours: formatHours(item.totalHours) })}
				</p>
			</div>
			<ChevronRight
				aria-hidden="true"
				className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
			/>
		</button>
	);
}
