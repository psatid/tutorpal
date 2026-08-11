import { Check, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/hooks/queries/use-students";
import { cn } from "@/lib/utils";

interface StudentSelectorDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	selectedIds: string[];
	onChange: (selectedIds: string[]) => void;
}

export function StudentSelectorDrawer({
	isOpen,
	onOpenChange,
	selectedIds,
	onChange,
}: StudentSelectorDrawerProps) {
	const { t } = useTranslation(["classes", "students", "common"]);
	const { data: studentsData, isLoading } = useStudents({
		limit: 100,
		sortBy: "name",
		sortOrder: "asc",
	});
	const students = studentsData?.students ?? [];
	const [searchQuery, setSearchQuery] = useState("");
	const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);

	useEffect(() => {
		if (!isOpen) return;
		setLocalSelectedIds(selectedIds);
		setSearchQuery("");
	}, [isOpen, selectedIds]);

	const filteredStudents = useMemo(() => {
		const query = searchQuery.trim().toLocaleLowerCase();
		if (!query) return students;

		return students.filter(
			(student) =>
				student.getName().toLocaleLowerCase().includes(query) ||
				student.getGrade().toString().includes(query),
		);
	}, [searchQuery, students]);

	function toggleStudent(studentId: string) {
		setLocalSelectedIds((currentIds) =>
			currentIds.includes(studentId)
				? currentIds.filter((id) => id !== studentId)
				: [...currentIds, studentId],
		);
	}

	function toggleVisibleStudents() {
		const visibleIds = filteredStudents.map((student) => student.getId());
		if (visibleIds.length === 0) return;

		const allVisibleSelected = visibleIds.every((id) =>
			localSelectedIds.includes(id),
		);
		setLocalSelectedIds((currentIds) =>
			allVisibleSelected
				? currentIds.filter((id) => !visibleIds.includes(id))
				: [...currentIds, ...visibleIds.filter((id) => !currentIds.includes(id))],
		);
	}

	function close() {
		setSearchQuery("");
		onOpenChange(false);
	}

	const allVisibleSelected =
		filteredStudents.length > 0 &&
		filteredStudents.every((student) =>
			localSelectedIds.includes(student.getId()),
		);

	return (
		<ResponsiveDrawer
			footer={
				<Button
					className="w-full md:w-fit"
					leftIcon={Check}
					onClick={() => {
						onChange(localSelectedIds);
						close();
					}}
					type="button"
				>
					{t("classes:selector.done", { count: localSelectedIds.length })}
				</Button>
			}
			headerContent={
				<div className="space-y-3">
					<div className="flex items-center justify-between gap-3">
						<span className="text-sm text-muted-foreground">
							{t("classes:selector.selectedCount", {
								count: localSelectedIds.length,
							})}
						</span>
						<Button
							disabled={filteredStudents.length === 0}
							onClick={toggleVisibleStudents}
							size="sm"
							type="button"
							variant="ghost"
						>
							{allVisibleSelected
								? t("classes:selector.deselectAll")
								: t("classes:selector.selectAll")}
						</Button>
					</div>
					<Input
						leftIcon={Search}
						onChange={(event) => setSearchQuery(event.target.value)}
						placeholder={t("classes:selector.searchPlaceholder")}
						value={searchQuery}
					/>
				</div>
			}
			layer="nested"
			onOpenChange={(open) => {
				if (!open) close();
			}}
			open={isOpen}
			title={t("classes:selector.title")}
		>
			{isLoading ? (
				<div aria-label={t("common:loading")} className="space-y-3" role="status">
					<Skeleton className="h-14 w-full" />
					<Skeleton className="h-14 w-full" />
					<Skeleton className="h-14 w-full" />
				</div>
			) : filteredStudents.length === 0 ? (
				<div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
					<Users aria-hidden="true" className="mb-3 size-10 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						{searchQuery
							? t("classes:selector.noResults")
							: t("classes:selector.noStudents")}
					</p>
				</div>
			) : (
				<ul className="divide-y divide-border rounded-lg border border-border">
					{filteredStudents.map((student) => {
						const isSelected = localSelectedIds.includes(student.getId());

						return (
							<li key={student.getId()}>
								<button
									aria-pressed={isSelected}
									className={cn(
										"flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
										isSelected && "bg-primary/5",
									)}
									onClick={() => toggleStudent(student.getId())}
									type="button"
								>
									<span
										aria-hidden="true"
										className={cn(
											"flex size-5 shrink-0 items-center justify-center rounded border border-input",
											isSelected && "border-primary bg-primary text-primary-foreground",
										)}
									>
										{isSelected ? <Check className="size-3.5" /> : null}
									</span>
									<span className="min-w-0">
										<span className="block truncate text-sm font-medium text-foreground">
											{student.getName()}
										</span>
										<span className="block text-sm text-muted-foreground">
											{t("students:grade", { grade: student.getGrade() })}
										</span>
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</ResponsiveDrawer>
	);
}
