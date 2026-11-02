import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock03Icon as Clock3HugeIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@tutorpal/ui/button";
import { Skeleton } from "@tutorpal/ui/skeleton";
import { useInfiniteClassHourAdditions } from "@/hooks/queries/use-infinite-class-hour-additions";

export function ClassHourAdditionsSection({ classId }: { classId: string }) {
	const { t } = useTranslation(["classes", "common"]);
	const [showAll, setShowAll] = useState(false);
	const additionsQuery = useInfiniteClassHourAdditions(classId);
	const additions = useMemo(
		() =>
			additionsQuery.data?.pages.flatMap((page) => page.additions) ?? [],
		[additionsQuery.data],
	);
	const visibleAdditions = showAll ? additions : additions.slice(0, 2);

	return (
		<section
			aria-labelledby="class-hour-additions-title"
			className="rounded-xl border border-border bg-card p-4 sm:p-5"
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2">
					<HugeiconsIcon icon={Clock3HugeIcon} strokeWidth={2} aria-hidden="true" className="size-4 shrink-0 text-on-surface-variant" />
				<h2
					className="text-base font-medium tracking-[-0.01em] text-foreground"
					id="class-hour-additions-title"
				>
					{t("classes:hourAdditions.historyTitle")}
				</h2>
				</div>
				{additions.length > 2 ? (
					<Button onClick={() => setShowAll((current) => !current)} size="sm" type="button" variant="ghost">
						{t(`classes:hourAdditions.${showAll ? "showLess" : "viewAll"}`)}
					</Button>
				) : null}
			</div>
			{additionsQuery.isLoading ? (
				<div className="mt-4 space-y-3" role="status">
					<span className="sr-only">{t("common:loading")}</span>
					<Skeleton className="h-14 w-full" />
					<Skeleton className="h-14 w-full" />
				</div>
			) : additionsQuery.isError ? (
				<div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
					<p className="text-sm text-destructive" role="alert">
						{t("classes:hourAdditions.historyError")}
					</p>
					<Button
						className="mt-3"
						onClick={() => additionsQuery.refetch()}
						size="md"
						type="button"
						variant="outline"
					>
						{t("common:retry")}
					</Button>
				</div>
			) : additions.length === 0 ? (
				<p className="py-4 text-sm text-muted-foreground">
					{t("classes:hourAdditions.historyEmpty")}
				</p>
			) : (
				<>
					<ul className="mt-4 divide-y divide-border border-y border-border">
						{visibleAdditions.map((addition) => {
							const data = addition.getListItemData();
							const sourceLabel =
								data.source === "course"
									? t("classes:hourAdditions.historyCourse", {
										course: data.sourceCourseName ?? t("classes:hourAdditions.coursePreset"),
									})
									: t("classes:hourAdditions.historyCustom");

							return (
								<li
									className="flex items-start justify-between gap-4 py-3"
									key={data.id}
								>
									<div className="min-w-0">
										<p className="break-words text-sm font-medium text-foreground">
											{sourceLabel}
										</p>
										<p className="mt-1 text-sm text-muted-foreground">
											{data.formattedCreatedAt}
										</p>
									</div>
									<div className="max-w-36 shrink-0 space-y-1 text-right sm:max-w-none">
										<p className="tabular-nums text-sm font-medium text-foreground">
											+{data.formattedHours}
										</p>
										<p className="text-sm text-muted-foreground">
											{data.formattedRevenueAmount ??
												t("classes:revenue.notRecorded")}
										</p>
									</div>
								</li>
							);
						})}
					</ul>
					{additionsQuery.hasNextPage ? (
						<Button
							className="mt-3 w-full"
							loading={additionsQuery.isFetchingNextPage}
							onClick={() => additionsQuery.fetchNextPage()}
							type="button"
							variant="ghost"
						>
							{t("classes:hourAdditions.loadMore")}
						</Button>
					) : null}
				</>
			)}
		</section>
	);
}
