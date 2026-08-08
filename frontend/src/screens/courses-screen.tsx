import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Plus } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CourseDeleteDialog } from "@/components/courses/course-delete-dialog";
import type { CourseDeleteDialogState } from "@/components/courses/course-delete-dialog";
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
import { Course } from "@/models/course";
import type { CourseListFilters } from "@/types/course-query";

function sortParams(
	value: CourseSort,
): Pick<CourseListFilters, "sortBy" | "sortOrder"> {
	if (value === "createdAt-desc")
		return { sortBy: "createdAt", sortOrder: "desc" };
	if (value === "defaultTotalHours-desc")
		return { sortBy: "defaultTotalHours", sortOrder: "desc" };
	return { sortBy: "name", sortOrder: "asc" };
}

export function CoursesScreen() {
	const { t } = useTranslation(["courses"]);
	const navigate = useNavigate();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const fabRef = useRef<HTMLButtonElement>(null);
	const activeTriggerRef = useRef<HTMLButtonElement>(null);
	const emptyActionRef = useRef<HTMLButtonElement>(null);
	const courseActionTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
	const deleteOriginRef = useRef<HTMLButtonElement>(null);
	const deleteOriginIndexRef = useRef(-1);
	const conflictActionRef = useRef<HTMLButtonElement>(null);
	const revalidationErrorActionRef = useRef<HTMLButtonElement>(null);
	const deleteRevalidationRef = useRef(0);
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<CourseSort>("name-asc");
	const [formOpen, setFormOpen] = useState(false);
	const [editingCourse, setEditingCourse] = useState<Course | null>(null);
	const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
	const [deleteError, setDeleteError] = useState<CourseDeleteErrorKind | null>(
		null,
	);
	const [deleteDialogState, setDeleteDialogState] =
		useState<CourseDeleteDialogState>("confirm");
	const [deleteClassCount, setDeleteClassCount] = useState<number | null>(null);
	const [focusAfterDeleteIndex, setFocusAfterDeleteIndex] = useState<
		number | null
	>(null);
	const query = useCourses({
		limit: 100,
		search: search || undefined,
		...sortParams(sort),
	});
	const courses = query.data?.courses ?? [];
	const total = query.data?.pagination.total ?? courses.length;
	const deleteCourse = useDeleteCourse({
		onSuccess: () => {
			setDeletingCourse(null);
			setDeleteError(null);
			setDeleteDialogState("confirm");
			setDeleteClassCount(null);
			setFocusAfterDeleteIndex(deleteOriginIndexRef.current);
			toast.success(t("courses:deleteSuccess"));
		},
		onError: async (error, id) => {
			if (error.kind === "not-found") {
				setDeletingCourse(null);
				setDeleteError(null);
				setDeleteDialogState("confirm");
				setDeleteClassCount(null);
				setFocusAfterDeleteIndex(deleteOriginIndexRef.current);
				toast.info(t("courses:deleteAlreadyRemoved"));
				return;
			}
			if (error.kind === "in-use") {
				setDeleteError(null);
				const course =
					deletingCourse?.getId() === id
						? deletingCourse
						: courses.find((candidate) => candidate.getId() === id);
				if (course) await revalidateDeleteState(course, true);
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
		setEditingCourse(course);
		activeTriggerRef.current = triggerRef.current;
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
		].find(
			(candidate) =>
				candidate?.isConnected && candidate.getClientRects().length > 0,
		);
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
		setDeleteClassCount(null);
		setDeletingCourse(course);
		void revalidateDeleteState(course);
	}

	async function revalidateDeleteState(course: Course, forceBlocked = false) {
		const revalidationId = ++deleteRevalidationRef.current;
		setDeleteDialogState("checking");
		const result = await query.refetch();
		if (revalidationId !== deleteRevalidationRef.current) return;

		const refreshedCourse = result.data?.courses.find(
			(candidate) => candidate.getId() === course.getId(),
		);
		const classCount = refreshedCourse?.getClassCount();
		setDeletingCourse(refreshedCourse ?? course);

		if (
			forceBlocked ||
			(result.isSuccess && classCount !== undefined && classCount > 0)
		) {
			setDeleteClassCount(Math.max(classCount ?? course.getClassCount(), 1));
			setDeleteDialogState("blocked");
			return;
		}
		if (!result.isSuccess || classCount !== 0) {
			setDeleteClassCount(null);
			setDeleteDialogState("revalidation-error");
			return;
		}

		setDeleteClassCount(null);
		setDeleteDialogState("confirm");
	}

	function closeDeleteDialog() {
		if (deleteCourse.isPending) return;
		deleteRevalidationRef.current += 1;
		setDeletingCourse(null);
		setDeleteError(null);
		setDeleteDialogState("confirm");
		setDeleteClassCount(null);
		requestAnimationFrame(focusDeleteOrigin);
	}

	function viewCourseClasses() {
		if (!deletingCourse) return;
		const courseId = deletingCourse.getId();
		deleteRevalidationRef.current += 1;
		setDeletingCourse(null);
		setDeleteError(null);
		setDeleteDialogState("confirm");
		setDeleteClassCount(null);
		void navigate({ to: "/classes", search: { courseId } });
	}

	function confirmDelete() {
		if (!deletingCourse || deleteCourse.isPending) return;
		setDeleteError(null);
		if (deleteError === "unknown") {
			void revalidateDeleteState(deletingCourse);
			return;
		}
		deleteCourse.mutate(deletingCourse.getId());
	}

	function retryDeleteRevalidation() {
		if (deletingCourse) void revalidateDeleteState(deletingCourse);
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

	useEffect(() => {
		const actionRef =
			deleteDialogState === "blocked"
				? conflictActionRef
				: deleteDialogState === "revalidation-error"
					? revalidationErrorActionRef
					: null;
		if (!actionRef || !deletingCourse) return;

		const frame = requestAnimationFrame(() => actionRef.current?.focus());
		return () => cancelAnimationFrame(frame);
	}, [deleteDialogState, deletingCourse]);

	let content: ReactNode;
	if (query.isLoading) content = <WorkspaceListSkeleton />;
	else if (query.isError)
		content = (
			<WorkspaceErrorState
				description={t("courses:loadError.description")}
				onRetry={() => query.refetch()}
				title={t("courses:loadError.title")}
			/>
		);
	else if (courses.length === 0)
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
	else
		content = (
			<CourseList
				actionTriggerRef={(courseId, node) => {
					if (node) courseActionTriggerRefs.current.set(courseId, node);
					else courseActionTriggerRefs.current.delete(courseId);
				}}
				courses={courses}
				onDelete={requestDelete}
				onEdit={openEdit}
				onViewClasses={(course) =>
					void navigate({
						to: "/classes",
						search: { courseId: course.getId() },
					})
				}
			/>
		);

	return (
		<WorkspaceShell className="max-w-6xl">
			<WorkspaceHeader
				action={
					<Button
						aria-label={t("courses:newCourse")}
						className="hidden sm:inline-flex sm:w-auto sm:px-3"
						onClick={() => openCreate(triggerRef.current)}
						ref={triggerRef}
						size="icon"
					>
						<Plus data-icon="inline-start" />
						<span className="hidden sm:inline">{t("courses:newCourse")}</span>
					</Button>
				}
				countLabel={t("courses:count", { count: total })}
				description={t("courses:subtitle")}
				title={t("courses:title")}
			/>
			<WorkspaceMain>
				<CourseToolbar
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
				classCount={deleteClassCount}
				conflictActionRef={conflictActionRef}
				course={deletingCourse}
				error={deleteError === "unknown" ? "unknown" : null}
				isPending={deleteCourse.isPending}
				onClose={closeDeleteDialog}
				onConfirm={confirmDelete}
				onRetry={retryDeleteRevalidation}
				onViewClasses={viewCourseClasses}
				revalidationErrorActionRef={revalidationErrorActionRef}
				state={deleteDialogState}
			/>
		</WorkspaceShell>
	);
}
