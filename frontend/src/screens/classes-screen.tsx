import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Plus } from "lucide-react";
import {
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ClassDrawer } from "@/components/classes/class-drawer";
import { ClassHourAdditionsDrawer } from "@/components/classes/class-hour-additions-drawer";
import { ClassRow } from "@/components/classes/class-row";
import { ClassForm } from "@/components/classes/create-class-form";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import {
	WorkspaceHeader,
	WorkspaceList,
	WorkspaceMain,
	WorkspaceShell,
} from "@/components/workspaces/workspace";
import { WorkspaceFab } from "@/components/workspaces/workspace-fab";
import { WorkspaceSearchControls } from "@/components/workspaces/workspace-search-controls";
import {
	WorkspaceEmptyState,
	WorkspaceErrorState,
	WorkspaceListSkeleton,
} from "@/components/workspaces/workspace-state";
import {
	type ClassDeleteErrorKind,
	useDeleteClass,
} from "@/hooks/mutations/use-delete-class";
import { useInfiniteClasses } from "@/hooks/queries/use-infinite-classes";
import { useWorkspaceSearchControls } from "@/hooks/use-workspace-search-controls";
import { Class } from "@/models/class";
import type { ClassListFilters } from "@/types/class-query";

type SortValue = "createdAt-desc" | "name-asc" | "totalHours-desc";

function sortParams(
	value: SortValue,
): Pick<ClassListFilters, "sortBy" | "sortOrder"> {
	if (value === "name-asc") return { sortBy: "name", sortOrder: "asc" };
	if (value === "totalHours-desc") {
		return { sortBy: "totalHours", sortOrder: "desc" };
	}
	return { sortBy: "createdAt", sortOrder: "desc" };
}

export function ClassesScreen() {
	const { t } = useTranslation(["classes"]);
	const navigate = useNavigate();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const fabRef = useRef<HTMLButtonElement>(null);
	const activeTriggerRef = useRef<HTMLButtonElement>(null);
	const emptyActionRef = useRef<HTMLButtonElement>(null);
	const searchFallbackRef = useRef<HTMLDivElement>(null);
	const classActionTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
	const editOriginRef = useRef<HTMLButtonElement>(null);
	const deleteOriginRef = useRef<HTMLButtonElement>(null);
	const deleteOriginIndexRef = useRef(-1);
	const hourAdditionsOriginRef = useRef<HTMLButtonElement>(null);
	const [formOpen, setFormOpen] = useState(false);
	const [isCreatePending, setIsCreatePending] = useState(false);
	const [editingClass, setEditingClass] = useState<Class | null>(null);
	const [addingHoursClass, setAddingHoursClass] = useState<Class | null>(null);
	const [deletingClass, setDeletingClass] = useState<Class | null>(null);
	const [deleteError, setDeleteError] = useState<ClassDeleteErrorKind | null>(
		null,
	);
	const [focusAfterDeleteIndex, setFocusAfterDeleteIndex] = useState<
		number | null
	>(null);
	const { debouncedSearch, isDirty, reset, search, setSearch, setSort, sort } =
		useWorkspaceSearchControls<SortValue>({
			defaultSort: "createdAt-desc",
		});
	const classesQuery = useInfiniteClasses({
		search: debouncedSearch || undefined,
		...sortParams(sort),
	});
	const classes = useMemo(
		() => classesQuery.data?.pages.flatMap((page) => page.classes) ?? [],
		[classesQuery.data],
	);
	const total = classesQuery.data?.pages[0]?.pagination.total ?? 0;
	const sortChoices = ([
		"createdAt-desc",
		"name-asc",
		"totalHours-desc",
	] as SortValue[]).map((value) => ({
		value,
		label: t(`classes:workspaceSort.${value}`),
	}));
	const deleteClass = useDeleteClass({
		onSuccess: () => {
			setDeletingClass(null);
			setDeleteError(null);
			setFocusAfterDeleteIndex(deleteOriginIndexRef.current);
			toast.success(t("classes:delete.success"));
		},
		onError: (error) => {
			if (error.kind === "not-found") {
				setDeletingClass(null);
				setDeleteError(null);
				setFocusAfterDeleteIndex(deleteOriginIndexRef.current);
				toast.info(t("classes:delete.alreadyRemoved"));
				return;
			}

			setDeleteError(error.kind);
		},
	});

	const openCreate = (trigger: HTMLButtonElement | null) => {
		activeTriggerRef.current = trigger ?? fabRef.current ?? triggerRef.current;
		setFormOpen(true);
	};
	const focusTrigger = () => {
		const trigger = [
			activeTriggerRef.current,
			fabRef.current,
			triggerRef.current,
		].find(isVisibleButton);
		trigger?.focus();
	};
	const closeForm = () => {
		setIsCreatePending(false);
		setFormOpen(false);
		focusTrigger();
	};
	const focusEditOrigin = () => {
		if (isVisibleButton(editOriginRef.current)) {
			editOriginRef.current.focus();
			return;
		}
		focusTrigger();
	};
	const openEdit = (item: Class) => {
		editOriginRef.current =
			classActionTriggerRefs.current.get(item.getId()) ?? null;
		setEditingClass(item);
	};
	const focusHourAdditionsOrigin = () => {
		const trigger = [
			hourAdditionsOriginRef.current,
			triggerRef.current,
			fabRef.current,
		].find(isVisibleButton);
		trigger?.focus();
	};
	const openHourAdditions = (
		item: Class,
		trigger: HTMLButtonElement | null,
	) => {
		hourAdditionsOriginRef.current = trigger;
		setAddingHoursClass(item);
	};

	function isVisibleButton(
		candidate: HTMLButtonElement | null | undefined,
	): candidate is HTMLButtonElement {
		return Boolean(
			candidate?.isConnected &&
			!candidate.disabled &&
			candidate.getClientRects().length > 0,
		);
	}

	function focusDeleteOrigin() {
		const trigger = [
			deleteOriginRef.current,
			triggerRef.current,
			fabRef.current,
			emptyActionRef.current,
		].find(isVisibleButton);
		trigger?.focus();
	}

	function requestDelete(item: Class, index: number) {
		deleteOriginRef.current =
			classActionTriggerRefs.current.get(item.getId()) ?? null;
		deleteOriginIndexRef.current = index;
		setDeleteError(null);
		setDeletingClass(item);
	}

	function closeDeleteDialog() {
		if (deleteClass.isPending) return;
		setDeletingClass(null);
		setDeleteError(null);
		requestAnimationFrame(focusDeleteOrigin);
	}

	useEffect(() => {
		if (focusAfterDeleteIndex === null) return;

		const nextClass = [
			...classes.slice(focusAfterDeleteIndex),
			...classes.slice(0, focusAfterDeleteIndex).reverse(),
		]
			.map((item) => classActionTriggerRefs.current.get(item.getId()))
			.find(isVisibleButton);
		const searchInput =
			searchFallbackRef.current?.querySelector<HTMLInputElement>("input");
		const fallback = [
			nextClass,
			triggerRef.current,
			fabRef.current,
			emptyActionRef.current,
			searchInput,
		].find(
			(candidate) =>
				candidate?.isConnected && candidate.getClientRects().length > 0,
		);

		requestAnimationFrame(() => fallback?.focus());
		setFocusAfterDeleteIndex(null);
	}, [classes, focusAfterDeleteIndex]);

	const form = (
		<ClassForm
			formId="class-form"
			isOpen={formOpen}
			key={String(formOpen)}
			onPendingChange={setIsCreatePending}
			onSuccess={closeForm}
		/>
	);
	const submitButton = (
		<Button
			className="w-full md:w-fit"
			form="class-form"
			loading={isCreatePending}
			type="submit"
		>
			<Plus data-icon="inline-start" />
			{t("classes:createClass")}
		</Button>
	);

	let content: ReactNode;
	if (classesQuery.isLoading) content = <WorkspaceListSkeleton />;
	else if (classesQuery.isError) {
		content = (
			<WorkspaceErrorState
				description={t("classes:loadError.description")}
				onRetry={() => classesQuery.refetch()}
				title={t("classes:loadError.title")}
			/>
		);
	} else if (classes.length === 0) {
		content = (
			<WorkspaceEmptyState
				action={
					!debouncedSearch ? (
						<Button
							onClick={() => openCreate(emptyActionRef.current)}
							ref={emptyActionRef}
						>
							<Plus data-icon="inline-start" />
							{t("classes:createClass")}
						</Button>
					) : undefined
				}
				description={
					debouncedSearch
						? t("classes:noMatchesDescription")
						: t("classes:noClassesDescription")
				}
				icon={<BookOpen />}
				title={
					debouncedSearch ? t("classes:noMatches") : t("classes:noClasses")
				}
			/>
		);
	} else {
		content = (
			<ul className="space-y-3">
				{classes.map((item, index) => (
					<ClassRow
						actionTriggerRef={(node) => {
							if (node) {
								classActionTriggerRefs.current.set(item.getId(), node);
							} else {
								classActionTriggerRefs.current.delete(item.getId());
							}
						}}
						item={item}
						key={item.getId()}
						onAddHours={(trigger) => openHourAdditions(item, trigger)}
						onDelete={() => requestDelete(item, index)}
						onEdit={() => openEdit(item)}
						onOpen={() =>
							navigate({
								to: "/classes/$classId",
								params: { classId: item.getId() },
							})
						}
					/>
				))}
				{classesQuery.hasNextPage ? (
					<li>
						<Button
							className="w-full"
							disabled={classesQuery.isFetchingNextPage}
							onClick={() => classesQuery.fetchNextPage()}
							type="button"
							variant="ghost"
						>
							{classesQuery.isFetchingNextPage
								? t("classes:loadingMore")
								: t("classes:loadMore")}
						</Button>
					</li>
				) : null}
			</ul>
		);
	}

	return (
		<WorkspaceShell>
			<WorkspaceHeader
				action={
					<Button
						aria-label={t("classes:newClass")}
						className="hidden sm:inline-flex sm:w-auto sm:px-3"
						onClick={() => openCreate(triggerRef.current)}
						ref={triggerRef}
						size="icon"
						type="button"
					>
						<Plus data-icon="inline-start" />
						<span className="hidden sm:inline">{t("classes:newClass")}</span>
					</Button>
				}
				countLabel={t("classes:count", { count: total })}
				title={t("classes:title")}
			/>
			<WorkspaceMain>
				<div ref={searchFallbackRef}>
					<WorkspaceSearchControls
						clearSearchLabel={t("classes:clearSearch")}
						isDirty={isDirty}
						onReset={reset}
						onSearchChange={setSearch}
						onSortChange={setSort}
						resetLabel={t("classes:reset")}
						search={search}
						searchLabel={t("classes:searchLabel")}
						searchPlaceholder={t("classes:searchWorkspacePlaceholder")}
						sort={
							sortChoices.find((choice) => choice.value === sort) ??
							sortChoices[0]!
						}
						sortChoices={sortChoices}
						sortLabel={t("classes:sortLabel")}
					/>
				</div>
				<WorkspaceList className="pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
					{content}
				</WorkspaceList>
			</WorkspaceMain>
			<WorkspaceFab
				label={t("classes:newClass")}
				onClick={() => openCreate(fabRef.current)}
				triggerRef={fabRef}
			/>
			<ResponsiveDrawer
				description={t("classes:createDescription")}
				footer={submitButton}
				onCloseAutoFocus={focusTrigger}
				onOpenChange={(open, eventDetails) => {
					if (!open && isCreatePending) {
						eventDetails?.preventUnmountOnClose();
						return;
					}
					setFormOpen(open);
				}}
				open={formOpen}
				title={t("classes:createTitle")}
			>
				{form}
			</ResponsiveDrawer>
			<ClassDrawer
				classData={editingClass}
				isOpen={Boolean(editingClass)}
				mode="edit"
				onCloseAutoFocus={focusEditOrigin}
				onOpenChange={(open) => {
					if (!open) setEditingClass(null);
				}}
			/>
			<ClassHourAdditionsDrawer
				classData={addingHoursClass}
				onCloseAutoFocus={focusHourAdditionsOrigin}
				onOpenChange={(open) => {
					if (!open) setAddingHoursClass(null);
				}}
				open={Boolean(addingHoursClass)}
			/>
			<AlertDialog
				onOpenChange={(open, eventDetails) => {
					if (!open && deleteClass.isPending) {
						eventDetails.preventUnmountOnClose();
						return;
					}
					if (!open) closeDeleteDialog();
				}}
				open={Boolean(deletingClass)}
			>
				<AlertDialogContent aria-busy={deleteClass.isPending}>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("classes:delete.title", {
								name: deletingClass?.getDisplayName(),
							})}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("classes:delete.description")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					{deleteError === "unknown" ? (
						<p
							className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
							role="alert"
						>
							{t("classes:delete.error")}
						</p>
					) : null}
					{deleteClass.isPending ? (
						<p className="text-sm text-muted-foreground" role="status">
							{t("classes:delete.deleting")}
						</p>
					) : null}
					<AlertDialogFooter>
						<AlertDialogCancel
							disabled={deleteClass.isPending}
							onClick={closeDeleteDialog}
						>
							{t("classes:delete.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							aria-label={
								deleteClass.isPending
									? t("classes:delete.deleting")
									: deleteError === "unknown"
										? t("classes:delete.tryAgain")
										: t("classes:delete.deleteClass")
							}
							loading={deleteClass.isPending}
							onClick={() => {
								if (deletingClass && !deleteClass.isPending) {
									setDeleteError(null);
									deleteClass.mutate(deletingClass.getId());
								}
							}}
							variant="destructive"
						>
							{deleteClass.isPending
								? t("classes:delete.deleting")
								: deleteError === "unknown"
									? t("classes:delete.tryAgain")
									: t("classes:delete.deleteClass")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</WorkspaceShell>
	);
}
