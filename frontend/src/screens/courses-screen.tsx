import { BookOpen, Plus } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CourseDeleteDialog } from "@/components/courses/course-delete-dialog";
import { CourseFormDrawer } from "@/components/courses/course-form-drawer";
import { CourseList } from "@/components/courses/course-list";
import {
	CourseToolbar,
	type CourseSort,
} from "@/components/courses/course-toolbar";
import { Button } from "@/components/ui/button";
import {
	WorkspaceHeader,
	WorkspaceList,
	WorkspaceMain,
	WorkspaceShell,
} from "@/components/workspaces/workspace";
import { WorkspaceFab } from "@/components/workspaces/workspace-fab";
import {
	WorkspaceEmptyState,
	WorkspaceErrorState,
	WorkspaceListSkeleton,
} from "@/components/workspaces/workspace-state";
import {
	type CourseDeleteErrorKind,
	useDeleteCourse,
} from "@/hooks/mutations/use-courses";
import { useCourses } from "@/hooks/queries/use-courses";
import { useWorkspaceSearchControls } from "@/hooks/use-workspace-search-controls";
import { Course } from "@/models/course";
import type { CourseListFilters } from "@/types/course-query";

function sortParams(
	value: CourseSort,
): Pick<CourseListFilters, "sortBy" | "sortOrder"> {
	if (value === "createdAt-desc") {
		return { sortBy: "createdAt", sortOrder: "desc" };
	}
	if (value === "defaultTotalHours-desc") {
		return { sortBy: "defaultTotalHours", sortOrder: "desc" };
	}
	return { sortBy: "name", sortOrder: "asc" };
}

export function CoursesScreen() {
	const { t } = useTranslation(["courses"]);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const fabRef = useRef<HTMLButtonElement>(null);
	const activeTriggerRef = useRef<HTMLButtonElement>(null);
	const emptyActionRef = useRef<HTMLButtonElement>(null);
	const courseActionTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
	const deleteOriginRef = useRef<HTMLButtonElement>(null);
	const deleteOriginIndexRef = useRef(-1);
	const { debouncedSearch, isDirty, reset, search, setSearch, setSort, sort } =
		useWorkspaceSearchControls<CourseSort>({ defaultSort: "name-asc" });
	const [formOpen, setFormOpen] = useState(false);
	const [editingCourse, setEditingCourse] = useState<Course | null>(null);
	const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
	const [deleteError, setDeleteError] = useState<CourseDeleteErrorKind | null>(
		null,
	);
	const [focusAfterDeleteIndex, setFocusAfterDeleteIndex] = useState<
		number | null
	>(null);
	const query = useCourses({
		limit: 100,
		search: debouncedSearch || undefined,
		...sortParams(sort),
	});
	const courses = query.data?.courses ?? [];
	const total = query.data?.pagination.total ?? courses.length;
	const deleteCourse = useDeleteCourse({
		onSuccess: () => {
				setDeletingCourse(null);
				setDeleteError(null);
				setFocusAfterDeleteIndex(deleteOriginIndexRef.current);
				toast.success(t("courses:deleteSuccess"));
			},
		onError: (error) => {
				if (error.kind === "not-found") {
					setDeletingCourse(null);
					setDeleteError(null);
					setFocusAfterDeleteIndex(deleteOriginIndexRef.current);
					toast.info(t("courses:deleteAlreadyRemoved"));
					return;
				}
				setDeleteError(error.kind);
			},
		});

	function openCreate(trigger: HTMLButtonElement | null) {
		setEditingCourse(null);
		activeTriggerRef.current = trigger ?? fabRef.current ?? triggerRef.current;
		setFormOpen(true);
	}

	function openEdit(course: Course) {
		activeTriggerRef.current =
			courseActionTriggerRefs.current.get(course.getId()) ?? triggerRef.current;
		setEditingCourse(course);
		setFormOpen(true);
	}

	function closeForm() {
		setFormOpen(false);
		setEditingCourse(null);
		focusTrigger();
	}

	function focusTrigger() {
		const trigger = [
			activeTriggerRef.current,
			fabRef.current,
			triggerRef.current,
		].find(isVisibleButton);
		trigger?.focus();
	}

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

	function requestDelete(course: Course, index: number) {
		deleteOriginRef.current =
			courseActionTriggerRefs.current.get(course.getId()) ?? null;
		deleteOriginIndexRef.current = index;
		setDeleteError(null);
		setDeletingCourse(course);
	}

	function closeDeleteDialog() {
		if (deleteCourse.isPending) return;
		setDeletingCourse(null);
		setDeleteError(null);
		requestAnimationFrame(focusDeleteOrigin);
	}

	function confirmDelete() {
		if (!deletingCourse || deleteCourse.isPending) return;
		setDeleteError(null);
		deleteCourse.mutate(deletingCourse.getId());
	}

	useEffect(() => {
		if (focusAfterDeleteIndex === null) return;

		const nextCourse = courses
			.slice(focusAfterDeleteIndex)
			.concat(courses.slice(0, focusAfterDeleteIndex).reverse())
			.map((course) => courseActionTriggerRefs.current.get(course.getId()))
			.find(isVisibleButton);
		const fallback = [
			nextCourse,
			triggerRef.current,
			fabRef.current,
			emptyActionRef.current,
		].find(isVisibleButton);

		requestAnimationFrame(() => fallback?.focus());
		setFocusAfterDeleteIndex(null);
	}, [courses, focusAfterDeleteIndex]);

	let content: ReactNode;
	if (query.isLoading) content = <WorkspaceListSkeleton />;
	else if (query.isError) {
		content = (
			<WorkspaceErrorState
				description={t("courses:loadError.description")}
				onRetry={() => query.refetch()}
				title={t("courses:loadError.title")}
			/>
		);
	} else if (courses.length === 0) {
		content = (
			<WorkspaceEmptyState
				action={
					!search ? (
						<Button
							onClick={() => openCreate(emptyActionRef.current)}
							ref={emptyActionRef}
						>
							<Plus data-icon="inline-start" />
							{t("courses:createCourse")}
						</Button>
					) : undefined
				}
				description={
					search
						? t("courses:noMatchesDescription")
						: t("courses:noCoursesDescription")
				}
				icon={<BookOpen />}
				title={search ? t("courses:noMatches") : t("courses:noCourses")}
			/>
		);
	} else {
		content = (
			<CourseList
				actionTriggerRef={(courseId, node) => {
					if (node) courseActionTriggerRefs.current.set(courseId, node);
					else courseActionTriggerRefs.current.delete(courseId);
				}}
				courses={courses}
				onDelete={requestDelete}
				onEdit={openEdit}
			/>
		);
	}

	return (
		<WorkspaceShell>
			<WorkspaceHeader
				action={
					<Button
						aria-label={t("courses:newCourse")}
						className="hidden sm:inline-flex sm:w-auto sm:px-3"
						onClick={() => openCreate(triggerRef.current)}
						ref={triggerRef}
						size="icon"
						type="button"
					>
						<Plus data-icon="inline-start" />
						<span className="hidden sm:inline">{t("courses:newCourse")}</span>
					</Button>
				}
				countLabel={t("courses:count", { count: total })}
				title={t("courses:title")}
			/>
			<WorkspaceMain>
				<CourseToolbar
					isDirty={isDirty}
					onReset={reset}
					onSearchChange={setSearch}
					onSortChange={setSort}
					search={search}
					sort={sort}
				/>
				<WorkspaceList className="pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
					{content}
				</WorkspaceList>
			</WorkspaceMain>
			<WorkspaceFab
				label={t("courses:newCourse")}
				onClick={() => openCreate(fabRef.current)}
				triggerRef={fabRef}
			/>
			<CourseFormDrawer
				course={editingCourse}
				onCloseAutoFocus={focusTrigger}
				onOpenChange={setFormOpen}
				onSaved={closeForm}
				open={formOpen}
			/>
			<CourseDeleteDialog
				course={deletingCourse}
				error={deleteError === "unknown" ? "unknown" : null}
				isPending={deleteCourse.isPending}
				onClose={closeDeleteDialog}
				onConfirm={confirmDelete}
			/>
		</WorkspaceShell>
	);
}
