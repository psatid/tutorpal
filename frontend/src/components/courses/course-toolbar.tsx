import { useTranslation } from "react-i18next";
import {
	WorkspaceSearchControls,
	type WorkspaceControlChoice,
} from "@/components/workspaces/workspace-search-controls";

export type CourseSort =
	| "name-asc"
	| "createdAt-desc"
	| "defaultTotalHours-desc";

interface CourseToolbarProps {
	search: string;
	sort: CourseSort;
	isDirty: boolean;
	onSearchChange: (value: string) => void;
	onReset: () => void;
	onSortChange: (value: CourseSort) => void;
}

export function CourseToolbar({
	search,
	sort,
	isDirty,
	onSearchChange,
	onReset,
	onSortChange,
}: CourseToolbarProps) {
	const { t } = useTranslation(["courses"]);
	const sortChoices: WorkspaceControlChoice<CourseSort>[] = (
		[
			"name-asc",
			"createdAt-desc",
			"defaultTotalHours-desc",
		] as CourseSort[]
	).map((value) => ({ value, label: t(`courses:sort.${value}`) }));

	return (
		<WorkspaceSearchControls
			clearSearchLabel={t("courses:clearSearch")}
			isDirty={isDirty}
			onReset={onReset}
			onSearchChange={onSearchChange}
			onSortChange={onSortChange}
			resetLabel={t("courses:reset")}
			search={search}
			searchLabel={t("courses:searchLabel")}
			searchPlaceholder={t("courses:searchCourses")}
			sort={
				sortChoices.find((choice) => choice.value === sort) ??
				sortChoices[0]!
			}
			sortChoices={sortChoices}
			sortLabel={t("courses:sortLabel")}
		/>
	);
}
