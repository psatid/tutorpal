import { useNavigate } from "@tanstack/react-router";
import {
	BookOpen,
	ChevronRight,
	Clock,
	Edit3,
	MoreVertical,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CourseForm } from "@/components/courses/course-form";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDeleteCourse } from "@/hooks/mutations/use-courses";
import { useCourses } from "@/hooks/queries/use-courses";
import { Course } from "@/models/course";
import type { CourseListFilters } from "@/types/course-query";

type CourseSort = "name-asc" | "createdAt-desc" | "defaultTotalHours-desc";
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
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<CourseSort>("name-asc");
	const [formOpen, setFormOpen] = useState(false);
	const [editingCourse, setEditingCourse] =
		useState<Course | null>(null);
	const [deletingCourse, setDeletingCourse] =
		useState<Course | null>(null);
	const query = useCourses({
		limit: 100,
		search: search || undefined,
		...sortParams(sort),
	});
	const courses = query.data?.courses ?? [];
	const total = query.data?.pagination.total ?? courses.length;
	const deleteCourse = useDeleteCourse(() => setDeletingCourse(null));

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
	function requestDelete(course: Course) {
		if (course.hasClasses()) {
			toast.error(t("courses:courseInUse"));
			return;
		}
		setDeletingCourse(course);
	}

	const formTitle = editingCourse
		? t("courses:editCourse")
		: t("courses:createCourse");
	const form = (
		<CourseForm
			course={editingCourse}
			key={`${editingCourse?.getId() ?? "new"}-${formOpen}`}
			onSaved={closeForm}
		/>
	);
	const submitButton = (
		<Button className="w-full md:w-fit" form="course-form" type="submit">
			{editingCourse ? t("courses:saveChanges") : t("courses:createCourse")}
		</Button>
	);

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
			<div>
				{courses.map((course) => {
					const data = course.getListItemData();
					return (
					<div
						className="flex min-h-20 items-center gap-3 border-b border-border py-4 last:border-0"
						key={data.id}
					>
						<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<BookOpen className="size-5" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-foreground">
								{data.name}
							</p>
							<p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
								<Clock className="size-4" />
								{t("courses:defaultHours", {
									hours: data.formattedDefaultTotalHours,
								})}
							</p>
						</div>
						<Button
							className="hidden shrink-0 sm:inline-flex"
							onClick={() =>
								navigate({ to: "/classes", search: { courseId: data.id } })
							}
							variant="ghost"
						>
							{t("courses:classCount", { count: data.classCount })}
							<ChevronRight data-icon="inline-end" />
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										aria-label={t("courses:actionsFor", { name: data.name })}
										size="icon"
										variant="ghost"
									/>
								}
							>
								<MoreVertical />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuGroup>
									<DropdownMenuItem
										onClick={() =>
											navigate({
												to: "/classes",
											search: { courseId: data.id },
											})
										}
									>
										<ChevronRight />
										{t("courses:viewClasses", { count: data.classCount })}
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => openEdit(course)}>
										<Edit3 />
										{t("courses:editCourse")}
									</DropdownMenuItem>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem
										onClick={() => requestDelete(course)}
										variant="destructive"
									>
										<Trash2 />
										{t("courses:deleteCourse")}
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					);
				})}
			</div>
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
					<WorkspaceToolbar>
						<Input
							aria-label={t("courses:searchLabel")}
							className="md:flex-1"
							leftIcon={Search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder={t("courses:searchCourses")}
							value={search}
						/>
						<Select
							onValueChange={(value) =>
								setSort((value ?? "name-asc") as CourseSort)
							}
							value={sort}
						>
							<SelectTrigger className="md:w-56">
								<SelectValue>{t(`courses:sort.${sort}`)}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{(
										[
											"name-asc",
											"createdAt-desc",
											"defaultTotalHours-desc",
										] as CourseSort[]
									).map((value) => (
										<SelectItem key={value} value={value}>
											{t(`courses:sort.${value}`)}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</WorkspaceToolbar>
					<WorkspaceList className="pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">{content}</WorkspaceList>
			</WorkspaceMain>
			<WorkspaceFab
				label={t("courses:newCourse")}
				onClick={() => openCreate(fabRef.current)}
				triggerRef={fabRef}
			/>
			<ResponsiveDrawer
				description={t("courses:formDescription")}
				footer={submitButton}
				onCloseAutoFocus={focusTrigger}
				onOpenChange={setFormOpen}
				open={formOpen}
				title={formTitle}
			>
				{form}
			</ResponsiveDrawer>
			<AlertDialog
				onOpenChange={(open) => {
					if (!open) setDeletingCourse(null);
				}}
				open={Boolean(deletingCourse)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("courses:deleteTitle", { name: deletingCourse?.getName() })}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("courses:deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("courses:cancel")}</AlertDialogCancel>
						<AlertDialogAction
							disabled={deleteCourse.isPending}
							onClick={() => {
								if (deletingCourse) deleteCourse.mutate(deletingCourse.getId());
							}}
							variant="destructive"
						>
							{t("courses:deleteCourse")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</WorkspaceShell>
	);
}
