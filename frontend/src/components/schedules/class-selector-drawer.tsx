import { useRef, useState } from "react";
import { Check, X, Search, BookOpen, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Drawer,
	DrawerPortal,
	DrawerBackdrop,
	DrawerViewport,
	DrawerPopup,
	DrawerContent,
	DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInfiniteClasses } from "@/hooks/queries/use-infinite-classes";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/utils";

interface ClassSelectorDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	selectedClassId: string | null;
	onSelect: (classId: string) => void;
}

export function ClassSelectorDrawer({
	isOpen,
	onOpenChange,
	selectedClassId,
	onSelect,
}: ClassSelectorDrawerProps) {
	const { t } = useTranslation(["schedules"]);
	const [searchQuery, setSearchQuery] = useState("");
	const [localSelectedId, setLocalSelectedId] = useState<string | null>(
		selectedClassId,
	);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	const {
		data,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteClasses({
		search: searchQuery || undefined,
	});

	const classes = data?.pages.flatMap((page) => page.data) ?? [];

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
		<Drawer open={isOpen} onOpenChange={handleClose}>
			<DrawerPortal>
				<DrawerBackdrop />
				<DrawerViewport>
					<DrawerPopup className="max-h-[85vh]">
						<DrawerContent>
							<div className="w-12 h-1.5 bg-surface-variant rounded-full mx-auto my-4" />

							<div className="px-6 pb-4 border-b border-outline-variant">
								<div className="flex items-center justify-between mb-4">
									<h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
										{t("schedules:classSelector.title")}
									</h2>
									<DrawerClose className="p-2 rounded-full hover:bg-surface-variant transition-colors">
										<X className="w-6 h-6 text-on-surface-variant" />
									</DrawerClose>
								</div>

								<Input
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder={t("schedules:classSelector.searchPlaceholder")}
									leftIcon={Search}
								/>
							</div>

							<div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
								{isLoading ? (
									<div className="flex flex-col items-center justify-center py-8 space-y-3">
										<div className="animate-pulse w-12 h-12 rounded-full bg-surface-variant" />
										<div className="animate-pulse h-4 w-32 bg-surface-variant rounded" />
									</div>
								) : classes.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-12 text-center">
										<BookOpen className="w-12 h-12 text-surface-variant mb-3" />
										<p className="text-on-surface-variant">
											{searchQuery
												? t("schedules:classSelector.noResults")
												: t("schedules:classSelector.noClasses")}
										</p>
									</div>
								) : (
									<div className="space-y-2">
										{classes.map((cls) => {
											const isSelected = localSelectedId === cls.id;
											const studentNames = cls.students
												.map((s) => s.name)
												.join(", ");

											return (
												<button
													key={cls.id}
													type="button"
													onClick={() => handleSelect(cls.id)}
													className={cn(
														"w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
														isSelected
															? "bg-primary-container"
															: "bg-surface-container-low hover:bg-surface-container",
													)}
												>
													<div
														className={cn(
															"w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
															isSelected
																? "bg-primary border-primary"
																: "border-outline bg-surface",
														)}
													>
														{isSelected && (
															<Check className="w-4 h-4 text-on-primary" />
														)}
													</div>

													<div className="flex-1 min-w-0">
														<p className="font-medium text-on-surface truncate">
															{cls.name}
														</p>
														{studentNames && (
															<p className="text-sm text-on-surface-variant truncate">
																{studentNames}
															</p>
														)}
													</div>

													{cls.remainingHours !== undefined && (
														<div className="shrink-0 flex items-center gap-1 text-xs text-on-surface-variant">
															<Clock className="w-3 h-3" />
															<span>
																{t("schedules:classSelector.remainingHours", {
																	hours: cls.remainingHours,
																})}
															</span>
														</div>
													)}
												</button>
											);
										})}

										{/* Load More Sentinel */}
										<div ref={loadMoreRef}>
											{isFetchingNextPage && (
												<div className="flex justify-center items-center py-4 gap-2">
													<Loader2 className="w-5 h-5 animate-spin text-on-surface-variant" />
												</div>
											)}
										</div>
									</div>
								)}
							</div>

							<div className="px-6 py-4 border-t border-outline-variant">
								<Button
									onClick={handleConfirm}
									disabled={!localSelectedId}
									className="w-full"
									leftIcon={Check}
								>
									{t("schedules:classSelector.selectButton")}
								</Button>
							</div>
						</DrawerContent>
					</DrawerPopup>
				</DrawerViewport>
			</DrawerPortal>
		</Drawer>
	);
}
