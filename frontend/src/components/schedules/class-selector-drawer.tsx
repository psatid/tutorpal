import { BookOpen, Clock, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
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
	const [localSelectedId, setLocalSelectedId] = useState<string | null>(
		selectedClassId,
	);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		setLocalSelectedId(selectedClassId);
		setSearchQuery("");
	}, [isOpen, selectedClassId]);

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

	const handleSelect = (classId: string) => {
		setLocalSelectedId(classId);
	};

	const handleConfirm = () => {
		if (localSelectedId) {
			onSelect(localSelectedId);
			onOpenChange(false);
		}
	};

	const handleClose = () => {
		setLocalSelectedId(selectedClassId);
		setSearchQuery("");
		onOpenChange(false);
	};

	return (
		<ResponsiveDrawer
			footer={
				<Button
					className="w-full"
					disabled={!localSelectedId}
					onClick={handleConfirm}
				>
					{t("schedules:classSelector.selectButton")}
				</Button>
			}
			headerContent={
				<Input
					leftIcon={Search}
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
						<BookOpen className="mb-3 h-12 w-12 text-surface-variant" />
						<p className="text-on-surface-variant">
							{searchQuery
								? t("schedules:classSelector.noResults")
								: t("schedules:classSelector.noClasses")}
						</p>
					</div>
				) : (
					<div className="space-y-2">
						<fieldset className="space-y-2">
							<legend className="sr-only">
								{t("schedules:classSelector.title")}
							</legend>
							{classes.map((classItem) => {
								const data = classItem.getListItemData();
								const isSelected = localSelectedId === data.id;
								const optionId = `class-selector-${data.id}`;
								const studentNames = data.studentNames.join(", ");
								const balanceLabel =
									data.balanceState === "no-hours"
										? t("classes:balance.noHours")
										: data.balanceState === "exhausted"
											? t("classes:balance.exhausted")
											: t("schedules:classSelector.remainingHours", {
													hours: data.formattedRemainingHours,
												});

								return (
									<label
										className={cn(
											"flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
											isSelected
												? "border-primary bg-primary/5 text-primary"
												: "border-outline-variant bg-card hover:bg-surface-container",
										)}
										htmlFor={optionId}
										key={data.id}
									>
										<input
											checked={isSelected}
											className="h-4 w-4 shrink-0 accent-primary"
											id={optionId}
											name="class-selector"
											onChange={() => handleSelect(data.id)}
											type="radio"
											value={data.id}
										/>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-on-surface">
												{data.displayName}
											</p>
											{studentNames ? (
												<p className="truncate text-sm text-on-surface-variant">
													{studentNames}
												</p>
											) : null}
										</div>

										<div className="flex shrink-0 items-center gap-1 text-xs text-on-surface-variant">
											<Clock className="h-3 w-3" />
											<span>{balanceLabel}</span>
										</div>
									</label>
								);
							})}
						</fieldset>

						<div ref={loadMoreRef}>
							{isFetchingNextPage ? (
								<div className="flex items-center justify-center gap-2 py-4">
									<Loader2 className="h-5 w-5 animate-spin text-on-surface-variant" />
								</div>
							) : null}
						</div>
					</div>
				)}
			</div>
		</ResponsiveDrawer>
	);
}
