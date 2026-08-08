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
import { type ReactNode, useEffect, useRef, useState } from "react";
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
import {
  type CourseDeleteErrorKind,
  useDeleteCourse,
} from "@/hooks/mutations/use-courses";
import { useCourses } from "@/hooks/queries/use-courses";
import { Course } from "@/models/course";
import type { CourseListFilters } from "@/types/course-query";

type CourseSort = "name-asc" | "createdAt-desc" | "defaultTotalHours-desc";
type DeleteDialogState =
  | "confirm"
  | "checking"
  | "blocked"
  | "revalidation-error";
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
    useState<DeleteDialogState>("confirm");
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
        {courses.map((course, index) => {
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
                      onKeyDown={(event) => {
                        if (
                          !event.defaultPrevented &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          event.currentTarget.click();
                        }
                      }}
                      ref={(node) => {
                        if (node)
                          courseActionTriggerRefs.current.set(data.id, node);
                        else courseActionTriggerRefs.current.delete(data.id);
                      }}
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
                      onClick={() => requestDelete(course, index)}
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
        <WorkspaceList className="pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
          {content}
        </WorkspaceList>
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
          if (!open) closeDeleteDialog();
        }}
        open={Boolean(deletingCourse)}
      >
        <AlertDialogContent
          aria-busy={deleteCourse.isPending || deleteDialogState === "checking"}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialogState === "confirm"
                ? t("courses:deleteTitle", { name: deletingCourse?.getName() })
                : deleteDialogState === "checking"
                  ? t("courses:checkingCourseTitle", {
                      name: deletingCourse?.getName(),
                    })
                  : deleteDialogState === "revalidation-error"
                    ? t("courses:revalidationErrorTitle", {
                        name: deletingCourse?.getName(),
                      })
                    : t("courses:deleteBlockedTitle", {
                        name: deletingCourse?.getName(),
                      })}
            </AlertDialogTitle>
            <AlertDialogDescription
              aria-live={
                deleteDialogState === "blocked" ||
                deleteDialogState === "revalidation-error"
                  ? "assertive"
                  : undefined
              }
              role={
                deleteDialogState === "blocked" ||
                deleteDialogState === "revalidation-error"
                  ? "alert"
                  : undefined
              }
            >
              {deleteDialogState === "checking"
                ? t("courses:checkingCourseClasses")
                : deleteDialogState === "blocked"
                  ? t("courses:deleteBlockedDescription", {
                      count: deleteClassCount ?? 1,
                    })
                  : deleteDialogState === "revalidation-error"
                    ? t("courses:revalidationErrorDescription")
                    : t("courses:deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError === "unknown" ? (
            <p
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {t("courses:deleteError.unknown")}
            </p>
          ) : null}
          {deleteCourse.isPending ? (
            <p className="text-sm text-muted-foreground" role="status">
              {t("courses:deletingCourse")}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteCourse.isPending}
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
              {deleteDialogState === "confirm"
                ? t("courses:cancel")
                : t("courses:close")}
            </AlertDialogCancel>
            {deleteDialogState === "blocked" ? (
              <Button
                className="w-full sm:w-fit"
                onClick={viewCourseClasses}
                onKeyDown={(event) => {
                  if (
                    !event.defaultPrevented &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    event.currentTarget.click();
                  }
                }}
                ref={conflictActionRef}
                variant="outline"
              >
                {t("courses:viewClassesAction")}
                <ChevronRight data-icon="inline-end" />
              </Button>
            ) : null}
            {deleteDialogState === "revalidation-error" ? (
              <Button
                onClick={() => {
                  if (deletingCourse)
                    void revalidateDeleteState(deletingCourse);
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
                ref={revalidationErrorActionRef}
                variant="outline"
              >
                {t("courses:tryAgain")}
              </Button>
            ) : null}
            {deleteDialogState === "confirm" ? (
              <AlertDialogAction
                aria-label={
                  deleteCourse.isPending
                    ? t("courses:deletingCourse")
                    : deleteError === "unknown"
                      ? t("courses:tryAgain")
                      : t("courses:deleteCourse")
                }
                loading={deleteCourse.isPending}
                onClick={() => {
                  if (deletingCourse && !deleteCourse.isPending) {
                    setDeleteError(null);
                    if (deleteError === "unknown") {
                      void revalidateDeleteState(deletingCourse);
                      return;
                    }
                    deleteCourse.mutate(deletingCourse.getId());
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
                {deleteCourse.isPending
                  ? t("courses:deletingCourse")
                  : deleteError === "unknown"
                    ? t("courses:tryAgain")
                    : t("courses:deleteCourse")}
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceShell>
  );
}
