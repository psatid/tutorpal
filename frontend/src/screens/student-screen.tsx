import { useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StudentForm } from "@/components/students/student-form";
import { StudentList } from "@/components/students/student-list";
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
import { useInfiniteStudents } from "@/hooks/queries/use-infinite-students";
import { useDebounce } from "@/hooks/use-debounce";
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
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 300);
	const [sort, setSort] = useState<StudentSort>("createdAt-desc");
	const [formOpen, setFormOpen] = useState(false);
	const query = useInfiniteStudents({
		search: debouncedSearch || undefined,
		...sortParams(sort),
	});
	const students = query.data?.pages.flatMap((page) => page.students) ?? [];
	const total = query.data?.pages[0]?.pagination.total ?? 0;

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
						className="sm:w-auto sm:px-3"
						onClick={() => setFormOpen(true)}
						ref={triggerRef}
						size="icon"
					>
						<Plus data-icon="inline-start" />
						<span className="hidden sm:inline">{t("students:newStudent")}</span>
					</Button>
				}
				countLabel={t("students:count", { count: total })}
				description={t("students:subtitle")}
				title={t("students:title")}
			/>
			<WorkspaceMain>
					<WorkspaceToolbar>
						<Input
							aria-label={t("students:searchLabel")}
							className="md:flex-1"
							leftIcon={Search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder={t("students:searchPlaceholder")}
							value={search}
						/>
						<Select
							onValueChange={(value) =>
								setSort((value ?? "createdAt-desc") as StudentSort)
							}
							value={sort}
						>
							<SelectTrigger className="md:w-56">
								<SelectValue>{t(`students:sort.${sort}`)}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{(
										[
											"createdAt-desc",
											"createdAt-asc",
											"name-asc",
											"name-desc",
											"grade-asc",
											"grade-desc",
										] as StudentSort[]
									).map((value) => (
										<SelectItem key={value} value={value}>
											{t(`students:sort.${value}`)}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</WorkspaceToolbar>
					<WorkspaceList>
						<StudentList
							fetchNextPage={() => query.fetchNextPage()}
							hasNextPage={query.hasNextPage}
							hasSearch={Boolean(debouncedSearch)}
							isError={query.isError}
							isFetchingNextPage={query.isFetchingNextPage}
							isLoading={query.isLoading}
							onAddStudent={() => setFormOpen(true)}
							onRetry={() => query.refetch()}
							onViewStudent={viewStudent}
							students={students}
						/>
					</WorkspaceList>
			</WorkspaceMain>
			<ResponsiveDrawer
				description={t("students:createDescription")}
				footer={submitButton}
				onCloseAutoFocus={() => triggerRef.current?.focus()}
				onOpenChange={setFormOpen}
				open={formOpen}
				title={t("students:createTitle")}
			>
				{form}
			</ResponsiveDrawer>
		</WorkspaceShell>
	);
}
