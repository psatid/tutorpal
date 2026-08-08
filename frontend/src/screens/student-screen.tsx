import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StudentForm } from "@/components/students/student-form";
import { StudentList } from "@/components/students/student-list";
import { Button } from "@/components/ui/button";
import {
  WorkspaceHeader,
  WorkspaceList,
  WorkspaceMain,
  WorkspaceShell,
} from "@/components/workspaces/workspace";
import { WorkspaceFab } from "@/components/workspaces/workspace-fab";
import {
  WorkspaceSearchControls,
  type WorkspaceControlChoice,
} from "@/components/workspaces/workspace-search-controls";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { useInfiniteStudents } from "@/hooks/queries/use-infinite-students";
import { useWorkspaceSearchControls } from "@/hooks/use-workspace-search-controls";
import { Student } from "@/models/student";
import type { StudentListFilters } from "@/types/student-query";

type StudentSort =
  | "createdAt-desc"
  | "createdAt-asc"
  | "name-asc"
  | "name-desc"
  | "grade-asc"
  | "grade-desc";

function sortParams(
  value: StudentSort,
): Pick<StudentListFilters, "sortBy" | "sortOrder"> {
  const [sortBy, sortOrder] = value.split("-") as [
    NonNullable<StudentListFilters["sortBy"]>,
    NonNullable<StudentListFilters["sortOrder"]>,
  ];
  return { sortBy, sortOrder };
}

export function StudentScreen() {
  const { t } = useTranslation(["students"]);
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const activeTriggerRef = useRef<HTMLButtonElement>(null);
  const { search, debouncedSearch, isDirty, reset, setSearch, setSort, sort } =
    useWorkspaceSearchControls<StudentSort>({
      defaultSort: "createdAt-desc",
    });
  const [formOpen, setFormOpen] = useState(false);
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
  const query = useInfiniteStudents({
    search: debouncedSearch || undefined,
    ...sortParams(sort),
  });
  const students = query.data?.pages.flatMap((page) => page.students) ?? [];
  const total = query.data?.pages[0]?.pagination.total ?? 0;
  const sortChoices: WorkspaceControlChoice<StudentSort>[] = (
    [
      "createdAt-desc",
      "createdAt-asc",
      "name-asc",
      "name-desc",
      "grade-asc",
      "grade-desc",
    ] as StudentSort[]
  ).map((value) => ({ value, label: t(`students:sort.${value}`) }));

  const viewStudent = useCallback(
    (student: Student) => {
      void navigate({
        to: "/students/$studentId",
        params: { studentId: student.getId() },
      });
    },
    [navigate],
  );

  const form = (
    <StudentForm key={String(formOpen)} onCreated={() => setFormOpen(false)} />
  );
  const submitButton = (
    <Button className="w-full md:w-fit" form="student-form" type="submit">
      <Plus data-icon="inline-start" />
      {t("students:createStudent")}
    </Button>
  );

  return (
    <WorkspaceShell>
      <WorkspaceHeader
        action={
          <Button
            aria-label={t("students:newStudent")}
            className="hidden sm:inline-flex sm:w-auto sm:px-3"
            onClick={() => openCreate(triggerRef.current)}
            ref={triggerRef}
            size="icon"
          >
            <Plus data-icon="inline-start" />
            <span className="hidden sm:inline">{t("students:newStudent")}</span>
          </Button>
        }
        countLabel={t("students:count", { count: total })}
        title={t("students:title")}
      />
      <WorkspaceMain>
        <WorkspaceSearchControls
          clearSearchLabel={t("students:clearSearch")}
          isDirty={isDirty}
          onReset={reset}
          onSearchChange={setSearch}
          onSortChange={setSort}
          resetLabel={t("students:reset")}
          search={search}
          searchLabel={t("students:searchLabel")}
          searchPlaceholder={t("students:searchPlaceholder")}
          sort={
            sortChoices.find((choice) => choice.value === sort) ??
            sortChoices[0]!
          }
          sortChoices={sortChoices}
          sortLabel={t("students:sortLabel")}
        />
        <WorkspaceList className="pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
          <StudentList
            fetchNextPage={() => query.fetchNextPage()}
            hasNextPage={query.hasNextPage}
            hasSearch={Boolean(debouncedSearch)}
            isError={query.isError}
            isFetchingNextPage={query.isFetchingNextPage}
            isLoading={query.isLoading}
            onAddStudent={openCreate}
            onRetry={() => query.refetch()}
            onViewStudent={viewStudent}
            students={students}
          />
        </WorkspaceList>
      </WorkspaceMain>
      <WorkspaceFab
        label={t("students:newStudent")}
        onClick={() => openCreate(fabRef.current)}
        triggerRef={fabRef}
      />
      <ResponsiveDrawer
        description={t("students:createDescription")}
        footer={submitButton}
        onCloseAutoFocus={focusTrigger}
        onOpenChange={setFormOpen}
        open={formOpen}
        title={t("students:createTitle")}
      >
        {form}
      </ResponsiveDrawer>
    </WorkspaceShell>
  );
}
