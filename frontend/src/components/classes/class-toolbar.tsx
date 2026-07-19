import { Search, ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ClassSortBy, ClassSortOrder } from "@/types/class-query";

interface ClassToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: ClassSortBy | undefined;
  sortOrder: ClassSortOrder | undefined;
  onSortChange: (
    sortBy: ClassSortBy,
    sortOrder: ClassSortOrder,
  ) => void;
}

export function ClassToolbar({
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortOrder,
  onSortChange,
}: ClassToolbarProps) {
  const { t } = useTranslation(["classes"]);

  const sortOptions: {
    value: string;
    sortBy: ClassSortBy;
    sortOrder: ClassSortOrder;
    label: string;
  }[] = [
    { value: "createdAt-desc", sortBy: "createdAt", sortOrder: "desc", label: t("classes:sort.newest") },
    { value: "createdAt-asc", sortBy: "createdAt", sortOrder: "asc", label: t("classes:sort.oldest") },
    { value: "name-asc", sortBy: "name", sortOrder: "asc", label: t("classes:sort.nameAsc") },
    { value: "name-desc", sortBy: "name", sortOrder: "desc", label: t("classes:sort.nameDesc") },
    { value: "totalHours-desc", sortBy: "totalHours", sortOrder: "desc", label: t("classes:sort.hoursHigh") },
    { value: "totalHours-asc", sortBy: "totalHours", sortOrder: "asc", label: t("classes:sort.hoursLow") },
  ];

  return (
    <div className="mb-4 space-y-3">
      <Input
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder={t("classes:searchPlaceholder")}
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
