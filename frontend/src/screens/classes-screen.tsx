import { useNavigate, useSearch } from "@tanstack/react-router";
import { BookOpen, Plus, Search } from "lucide-react";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClassRow } from "@/components/classes/class-row";
import {
	CreateClassForm,
	CUSTOM_CLASS_VALUE,
} from "@/components/classes/create-class-form";
import { Button } from "@/components/ui/button";
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
import { useCourses } from "@/hooks/queries/use-courses";
import { useInfiniteClasses } from "@/hooks/queries/use-infinite-classes";
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
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortValue>("createdAt-desc");
	const [formOpen, setFormOpen] = useState(false);
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

	const closeForm = () => {
		setFormOpen(false);
		triggerRef.current?.focus();
	};
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
						<Button onClick={() => setFormOpen(true)}>
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
				{classes.map((item) => (
					<ClassRow
						item={item}
						key={item.getId()}
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
						className="sm:w-auto sm:px-3"
						onClick={() => setFormOpen(true)}
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
						<Input
							aria-label={t("classes:searchLabel")}
							className="md:flex-1"
							leftIcon={Search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder={t("classes:searchWorkspacePlaceholder")}
							value={search}
						/>
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
					<WorkspaceList>{content}</WorkspaceList>
			</WorkspaceMain>
			<ResponsiveDrawer
				description={t("classes:createDescription")}
				footer={submitButton}
				onCloseAutoFocus={() => triggerRef.current?.focus()}
				onOpenChange={setFormOpen}
				open={formOpen}
				title={t("classes:createTitle")}
			>
				{form}
			</ResponsiveDrawer>
		</WorkspaceShell>
	);
}
