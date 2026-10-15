import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen01Icon as BookOpenHugeIcon,
  Tick02Icon as CheckHugeIcon,
  Clock01Icon as ClockHugeIcon,
  Loading03Icon as Loader2HugeIcon,
  Search01Icon as SearchHugeIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/common/input";
import { ResponsiveDrawer } from "@/components/common/responsive-drawer";
import { useInfiniteClasses } from "@/hooks/queries/use-infinite-classes";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/utils";

interface ClassSelectorDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onCloseAutoFocus?: () => void;
	selectedClassId: string | null;
	onSelect: (classId: string) => void;
}

export function ClassSelectorDrawer({
	isOpen,
	onOpenChange,
	onCloseAutoFocus,
	selectedClassId,
	onSelect,
}: ClassSelectorDrawerProps) {
	const { t } = useTranslation(["schedules", "classes"]);
	const [searchQuery, setSearchQuery] = useState("");
	const loadMoreRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		setSearchQuery("");
	}, [isOpen]);

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteClasses({
			search: searchQuery || undefined,
		});

	const classes = data?.pages.flatMap((page) => page.classes) ?? [];

	useIntersectionObserver(
		loadMoreRef,
		() => {
			if (hasNextPage && !isFetchingNextPage) {
				fetchNextPage();
			}
		},
		{
			enabled: classes.length > 0 && !isLoading,
		},
	);

	const handleClose = () => {
		setSearchQuery("");
		onOpenChange(false);
	};

	const handleSelect = (classId: string) => {
		onSelect(classId);
		handleClose();
	};

	return (
		<ResponsiveDrawer
			headerContent={
				<Input
					leftIcon={SearchHugeIcon}
					onChange={(event) => setSearchQuery(event.target.value)}
					placeholder={t("schedules:classSelector.searchPlaceholder")}
					value={searchQuery}
				/>
			}
			layer="nested"
			onCloseAutoFocus={onCloseAutoFocus}
			onOpenChange={(open) => {
				if (!open) handleClose();
			}}
			open={isOpen}
			title={t("schedules:classSelector.title")}
		>
			<div className="min-h-0">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center space-y-3 py-8">
						<div className="h-12 w-12 animate-pulse rounded-full bg-surface-variant" />
						<div className="h-4 w-32 animate-pulse rounded bg-surface-variant" />
					</div>
				) : classes.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<HugeiconsIcon icon={BookOpenHugeIcon} strokeWidth={2} aria-hidden="true" className="mb-3 h-12 w-12 text-surface-variant" />
						<p className="text-on-surface-variant">
							{searchQuery
								? t("schedules:classSelector.noResults")
								: t("schedules:classSelector.noClasses")}
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{classes.map((classItem) => {
							const data = classItem.getListItemData();
							const isSelected = selectedClassId === data.id;
							const studentNames = data.studentNames.join(", ");
							const balanceLabel =
								data.balanceState === "no-hours"
									? t("classes:balance.noHours")
									: data.balanceState === "all-scheduled"
										? t("classes:balance.allScheduled")
										: data.balanceState === "exhausted"
											? t("classes:balance.exhausted")
											: t("classes:balance.available", {
												hours: data.formattedRemainingHours,
											});

							return (
								<button
									className={cn(
										"flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
										isSelected
											? "border-primary bg-primary/5 text-primary"
											: "border-outline-variant bg-card hover:bg-surface-container-low",
									)}
									key={data.id}
									onClick={() => handleSelect(data.id)}
									type="button"
								>
									<span className="block min-w-0 flex-1">
										<span className="block truncate font-medium text-on-surface">
											{data.displayName}
										</span>
										{studentNames ? (
											<span className="block truncate text-sm text-on-surface-variant">
												{studentNames}
											</span>
										) : null}
									</span>

									<span className="flex shrink-0 items-center gap-1 text-xs text-on-surface-variant">
										<HugeiconsIcon icon={ClockHugeIcon} strokeWidth={2} aria-hidden="true" className="h-3 w-3" />
										<span>{balanceLabel}</span>
									</span>
									{isSelected ? (
										<span className="flex shrink-0 items-center text-primary">
											<HugeiconsIcon icon={CheckHugeIcon} strokeWidth={2} aria-hidden="true" className="size-4" />
											<span className="sr-only">
												{t("schedules:classSelector.selected")}
											</span>
										</span>
									) : null}
								</button>
							);
						})}

						<div ref={loadMoreRef}>
							{isFetchingNextPage ? (
								<div className="flex items-center justify-center gap-2 py-4">
									<HugeiconsIcon icon={Loader2HugeIcon} strokeWidth={2} aria-hidden="true" className="h-5 w-5 animate-spin text-on-surface-variant" />
								</div>
							) : null}
						</div>
					</div>
				)}
			</div>
		</ResponsiveDrawer>
	);
}
