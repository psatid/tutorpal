import { Search, ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StudentSortBy, StudentSortOrder } from "@/types/student-query";

interface StudentToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: StudentSortBy;
  sortOrder: StudentSortOrder;
  onSortChange: (
    sortBy: StudentSortBy,
    sortOrder: StudentSortOrder,
  ) => void;
}

export function StudentToolbar({
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortOrder,
  onSortChange,
}: StudentToolbarProps) {
  const { t } = useTranslation(["students"]);

  const sortOptions: {
    value: string;
    sortBy: StudentSortBy;
    sortOrder: StudentSortOrder;
    label: string;
  }[] = [
    { value: "createdAt-desc", sortBy: "createdAt", sortOrder: "desc", label: t("students:sort.newest") },
    { value: "createdAt-asc", sortBy: "createdAt", sortOrder: "asc", label: t("students:sort.oldest") },
    { value: "name-asc", sortBy: "name", sortOrder: "asc", label: t("students:sort.nameAsc") },
    { value: "name-desc", sortBy: "name", sortOrder: "desc", label: t("students:sort.nameDesc") },
    { value: "grade-asc", sortBy: "grade", sortOrder: "asc", label: t("students:sort.gradeAsc") },
    { value: "grade-desc", sortBy: "grade", sortOrder: "desc", label: t("students:sort.gradeDesc") },
  ];

  return (
    <div className="mb-4 space-y-3">
      <Input
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder={t("students:searchPlaceholder")}
        leftIcon={Search}
      />

      {/* Sort Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <ArrowUpDown className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
        {sortOptions.map((option) => {
          const isActive = sortBy === option.sortBy && sortOrder === option.sortOrder;
          return (
            <button
              key={option.value}
              onClick={() => onSortChange(option.sortBy, option.sortOrder)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-on-surface-variant border-outline-variant hover:border-outline hover:text-on-surface"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
