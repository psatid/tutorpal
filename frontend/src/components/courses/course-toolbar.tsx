import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export type CourseSort =
	| "name-asc"
	| "createdAt-desc"
	| "defaultTotalHours-desc";

interface CourseToolbarProps {
	search: string;
	sort: CourseSort;
	onSearchChange: (value: string) => void;
	onSortChange: (value: CourseSort) => void;
}

export function CourseToolbar({
	search,
	sort,
	onSearchChange,
	onSortChange,
}: CourseToolbarProps) {
	const { t } = useTranslation(["courses"]);

	return (
		<div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
			<Input
				aria-label={t("courses:searchLabel")}
				className="md:flex-1"
				leftIcon={Search}
				onChange={(event) => onSearchChange(event.target.value)}
				placeholder={t("courses:searchCourses")}
				value={search}
			/>
			<Select
				onValueChange={(value) =>
					onSortChange((value ?? "name-asc") as CourseSort)
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
		</div>
	);
}
