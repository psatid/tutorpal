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
import type { GetV1Courses200DataItem } from "@/api/generated/models/getV1Courses200DataItem";
import type { GetV1CoursesParams } from "@/api/generated/models/getV1CoursesParams";
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
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import {
	WorkspaceEmptyState,
	WorkspaceErrorState,
	WorkspaceListSkeleton,
} from "@/components/workspaces/workspace-state";
import { useDeleteCourse } from "@/hooks/mutations/use-courses";
import { useCourses } from "@/hooks/queries/use-courses";

function formatHours(value: number) {
	return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
		value,
	);
}
type CourseSort = "name-asc" | "createdAt-desc" | "defaultTotalHours-desc";
function sortParams(
	value: CourseSort,
): Pick<GetV1CoursesParams, "sortBy" | "sortOrder"> {
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
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<CourseSort>("name-asc");
	const [formOpen, setFormOpen] = useState(false);
	const [editingCourse, setEditingCourse] =
		useState<GetV1Courses200DataItem | null>(null);
	const [deletingCourse, setDeletingCourse] =
		useState<GetV1Courses200DataItem | null>(null);
	const query = useCourses({
		limit: 100,
		search: search || undefined,
		...sortParams(sort),
	});
	const courses = query.data?.data ?? [];
	const total = query.data?.pagination.total ?? courses.length;
	const deleteCourse = useDeleteCourse(() => setDeletingCourse(null));

	function openCreate() {
		setEditingCourse(null);
		setFormOpen(true);
	}
	function openEdit(course: GetV1Courses200DataItem) {
		setEditingCourse(course);
		setFormOpen(true);
	}
	function closeForm() {
		setFormOpen(false);
		setEditingCourse(null);
		triggerRef.current?.focus();
	}
	function requestDelete(course: GetV1Courses200DataItem) {
		if (course.classCount > 0) {
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
			key={`${editingCourse?.id ?? "new"}-${formOpen}`}
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
						<Button onClick={openCreate}>
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
				{courses.map((course) => (
					<div
						className="flex min-h-20 items-center gap-3 border-b border-border py-4 last:border-0"
						key={course.id}
					>
						<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<BookOpen className="size-5" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-foreground">
								{course.name}
							</p>
							<p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
								<Clock className="size-4" />
								{t("courses:defaultHours", {
									hours: formatHours(course.defaultTotalHours),
								})}
							</p>
						</div>
						<Button
							className="hidden shrink-0 sm:inline-flex"
							onClick={() =>
								navigate({ to: "/classes", search: { courseId: course.id } })
							}
							variant="ghost"
						>
							{t("courses:classCount", { count: course.classCount })}
							<ChevronRight data-icon="inline-end" />
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										aria-label={t("courses:actionsFor", { name: course.name })}
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
												search: { courseId: course.id },
											})
										}
									>
										<ChevronRight />
										{t("courses:viewClasses", { count: course.classCount })}
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
				))}
			</div>
		);

	return (
		<WorkspaceShell className="max-w-6xl">
			<WorkspaceHeader
				action={
					<Button
						aria-label={t("courses:newCourse")}
						className="sm:w-auto sm:px-3"
						onClick={openCreate}
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
					<WorkspaceList>{content}</WorkspaceList>
			</WorkspaceMain>
			<ResponsiveDrawer
				description={t("courses:formDescription")}
				footer={submitButton}
				onCloseAutoFocus={() => triggerRef.current?.focus()}
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
							{t("courses:deleteTitle", { name: deletingCourse?.name })}
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
								if (deletingCourse) deleteCourse.mutate(deletingCourse.id);
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
