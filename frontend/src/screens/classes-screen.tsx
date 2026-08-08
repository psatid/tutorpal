import { useNavigate, useSearch } from "@tanstack/react-router";
import { BookOpen, Plus, Search } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ClassRow } from "@/components/classes/class-row";
import {
	CreateClassForm,
	CUSTOM_CLASS_VALUE,
} from "@/components/classes/create-class-form";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	WorkspaceHeader,
	WorkspaceList,
	WorkspaceMain,
	WorkspaceShell,
	WorkspaceToolbar,
} from "@/components/workspaces/workspace";
import { WorkspaceFab } from "@/components/workspaces/workspace-fab";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import {
	WorkspaceEmptyState,
	WorkspaceErrorState,
	WorkspaceListSkeleton,
} from "@/components/workspaces/workspace-state";
import { useCourses } from "@/hooks/queries/use-courses";
import { useInfiniteClasses } from "@/hooks/queries/use-infinite-classes";
import {
	type ClassDeleteErrorKind,
	useDeleteClass,
} from "@/hooks/mutations/use-delete-class";
import { Class } from "@/models/class";
import type { ClassListFilters } from "@/types/class-query";

type ClassesSearch = {
	courseId?: string;
	classType?: "custom" | "course-linked";
};
type SortValue = "createdAt-desc" | "name-asc" | "totalHours-desc";

function sortParams(
	value: SortValue,
): Pick<ClassListFilters, "sortBy" | "sortOrder"> {
	if (value === "name-asc") return { sortBy: "name", sortOrder: "asc" };
	if (value === "totalHours-desc")
		return { sortBy: "totalHours", sortOrder: "desc" };
	return { sortBy: "createdAt", sortOrder: "desc" };
}

export function ClassesScreen() {
	const { t } = useTranslation(["classes"]);
	const navigate = useNavigate();
	const routeSearch = useSearch({ strict: false }) as ClassesSearch;
	const triggerRef = useRef<HTMLButtonElement>(null);
	const fabRef = useRef<HTMLButtonElement>(null);
	const activeTriggerRef = useRef<HTMLButtonElement>(null);
	const emptyActionRef = useRef<HTMLButtonElement>(null);
	const searchFallbackRef = useRef<HTMLDivElement>(null);
	const classActionTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
	const deleteOriginRef = useRef<HTMLButtonElement>(null);
	const deleteOriginIndexRef = useRef(-1);
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortValue>("createdAt-desc");
	const [formOpen, setFormOpen] = useState(false);
	const [deletingClass, setDeletingClass] = useState<Class | null>(null);
	const [deleteError, setDeleteError] = useState<ClassDeleteErrorKind | null>(
		null,
	);
	const [focusAfterDeleteIndex, setFocusAfterDeleteIndex] = useState<
		number | null
	>(null);
	const coursesQuery = useCourses({
		limit: 100,
		sortBy: "name",
		sortOrder: "asc",
	});
	const courses = coursesQuery.data?.courses ?? [];
	const filterValue = routeSearch.courseId
		? `course:${routeSearch.courseId}`
		: routeSearch.classType === "custom"
			? CUSTOM_CLASS_VALUE
			: routeSearch.classType === "course-linked"
				? "__course_linked__"
				: "all";
	const classesQuery = useInfiniteClasses({
		search: search || undefined,
		courseId: routeSearch.courseId,
		classType: routeSearch.courseId ? undefined : routeSearch.classType,
		...sortParams(sort),
	});
	const classes = useMemo(
		() => classesQuery.data?.pages.flatMap((page) => page.classes) ?? [],
		[classesQuery.data],
	);
	const total = classesQuery.data?.pages[0]?.pagination.total ?? 0;
	const selectedCourse =
		courses.find((course) => course.getId() === routeSearch.courseId) ?? null;
	const filterLabel =
		selectedCourse?.getName() ??
		(routeSearch.classType === "custom"
			? t("classes:customClasses")
			: routeSearch.classType === "course-linked"
				? t("classes:courseLinkedClasses")
				: t("classes:allClasses"));
	const emptyTitle = routeSearch.courseId
		? t("classes:noCourseClasses", { course: filterLabel })
		: routeSearch.classType === "custom"
			? t("classes:noCustomClasses")
			: routeSearch.classType === "course-linked"
				? t("classes:noCourseLinkedClasses")
				: t("classes:noClasses");
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

	function changeFilter(value: string | null) {
		const next = value ?? "all";
		if (next.startsWith("course:"))
			void navigate({
				to: "/classes",
				search: { courseId: next.slice(7) },
				replace: true,
			});
		else if (next === CUSTOM_CLASS_VALUE)
			void navigate({
				to: "/classes",
				search: { classType: "custom" },
				replace: true,
			});
		else if (next === "__course_linked__")
			void navigate({
				to: "/classes",
				search: { classType: "course-linked" },
				replace: true,
			});
		else void navigate({ to: "/classes", search: {}, replace: true });
	}

	const openCreate = (trigger: HTMLButtonElement | null) => {
		activeTriggerRef.current = trigger ?? fabRef.current ?? triggerRef.current;
		setFormOpen(true);
	};
	const focusTrigger = () => {
		const trigger = [
			activeTriggerRef.current,
			fabRef.current,
			triggerRef.current,
		].find(
				(candidate) =>
					candidate?.isConnected && candidate.getClientRects().length > 0,
			);
		trigger?.focus();
	};
	const closeForm = () => {
		setFormOpen(false);
		focusTrigger();
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
		const searchInput = searchFallbackRef.current?.querySelector<HTMLInputElement>(
			"input",
		);
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
		<CreateClassForm
			courses={courses}
			key={`${routeSearch.courseId ?? routeSearch.classType ?? "all"}-${formOpen}`}
			onCreated={closeForm}
			preferredCourseId={routeSearch.courseId ?? null}
		/>
	);
	const submitButton = (
		<Button className="w-full md:w-fit" form="class-form" type="submit">
			<Plus data-icon="inline-start" />
			{t("classes:createClass")}
		</Button>
	);

	let content: ReactNode;
	if (classesQuery.isLoading) content = <WorkspaceListSkeleton />;
	else if (classesQuery.isError)
		content = (
			<WorkspaceErrorState
				description={t("classes:loadError.description")}
				onRetry={() => classesQuery.refetch()}
				title={t("classes:loadError.title")}
			/>
		);
	else if (classes.length === 0)
		content = (
			<WorkspaceEmptyState
				action={
					!search ? (
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
					search
						? t("classes:noMatchesDescription")
						: t("classes:noClassesDescription")
				}
				icon={<BookOpen />}
				title={search ? t("classes:noMatches") : emptyTitle}
			/>
		);
	else
		content = (
			<div>
				{classes.map((item, index) => (
					<ClassRow
						actionTriggerRef={(node) => {
							if (node) classActionTriggerRefs.current.set(item.getId(), node);
							else classActionTriggerRefs.current.delete(item.getId());
						}}
						item={item}
						key={item.getId()}
						onDelete={() => requestDelete(item, index)}
						onOpen={() =>
							navigate({
								to: "/classes/$classId",
								params: { classId: item.getId() },
							})
						}
					/>
				))}
				{classesQuery.hasNextPage ? (
					<Button
						className="mt-3 w-full"
						disabled={classesQuery.isFetchingNextPage}
						onClick={() => classesQuery.fetchNextPage()}
						variant="ghost"
					>
						{classesQuery.isFetchingNextPage
							? t("classes:loadingMore")
							: t("classes:loadMore")}
					</Button>
				) : null}
			</div>
		);

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
					>
						<Plus data-icon="inline-start" />
						<span className="hidden sm:inline">{t("classes:newClass")}</span>
					</Button>
				}
				countLabel={t("classes:count", { count: total })}
				description={t("classes:subtitle")}
				title={t("classes:title")}
			/>
			<WorkspaceMain>
					<div className="mb-4">
						<h2 className="truncate text-lg font-bold text-foreground">
							{filterLabel}
						</h2>
					</div>
					<WorkspaceToolbar>
						<div className="md:flex-1" ref={searchFallbackRef}>
							<Input
								aria-label={t("classes:searchLabel")}
								leftIcon={Search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder={t("classes:searchWorkspacePlaceholder")}
								value={search}
							/>
						</div>
						<Select onValueChange={changeFilter} value={filterValue}>
							<SelectTrigger className="md:w-60">
								<SelectValue>{filterLabel}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="all">{t("classes:allClasses")}</SelectItem>
									<SelectItem value={CUSTOM_CLASS_VALUE}>
										{t("classes:customClasses")}
									</SelectItem>
									<SelectItem value="__course_linked__">
										{t("classes:courseLinkedClasses")}
									</SelectItem>
									{courses.map((course) => (
									<SelectItem key={course.getId()} value={`course:${course.getId()}`}>
										{course.getName()}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						<Select
							onValueChange={(value) =>
								setSort((value ?? "createdAt-desc") as SortValue)
							}
							value={sort}
						>
							<SelectTrigger className="md:w-48">
								<SelectValue>{t(`classes:workspaceSort.${sort}`)}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{(
										[
											"createdAt-desc",
											"name-asc",
											"totalHours-desc",
										] as SortValue[]
									).map((value) => (
										<SelectItem key={value} value={value}>
											{t(`classes:workspaceSort.${value}`)}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</WorkspaceToolbar>
					<WorkspaceList className="pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">{content}</WorkspaceList>
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
				onOpenChange={setFormOpen}
				open={formOpen}
				title={t("classes:createTitle")}
			>
				{form}
			</ResponsiveDrawer>
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
							onKeyDown={(event) => {
								if (
									!event.defaultPrevented &&
									(event.key === "Enter" || event.key === " ")
								) {
									event.preventDefault();
									event.currentTarget.click();
								}
							}}
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
							onKeyDown={(event) => {
								if (
									!event.defaultPrevented &&
									(event.key === "Enter" || event.key === " ")
								) {
									event.preventDefault();
									event.currentTarget.click();
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
