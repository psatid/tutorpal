import { useState, useMemo } from "react";
import { Check, Search, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { useStudents } from "@/hooks/queries/use-students";

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
  const { t } = useTranslation(["classes", "students"]);
  const { data: studentsData, isLoading } = useStudents();
  const students = studentsData?.data || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.grade.toString().includes(query)
    );
  }, [students, searchQuery]);

  const handleToggleStudent = (studentId: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (filteredStudents.length === 0) return;
    const allIds = filteredStudents.map((s) => s.id);
    const allSelected = allIds.every((id) => localSelectedIds.includes(id));
    
    if (allSelected) {
      // Deselect all visible
      setLocalSelectedIds((prev) =>
        prev.filter((id) => !allIds.includes(id))
      );
    } else {
      // Select all visible
      setLocalSelectedIds((prev) => {
        const newIds = allIds.filter((id) => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  };

  const handleDone = () => {
    onChange(localSelectedIds);
    onOpenChange(false);
  };

  const handleClose = () => {
    // Reset local state to original when closing without saving
    setLocalSelectedIds(selectedIds);
    setSearchQuery("");
    onOpenChange(false);
  };

  const selectedCount = localSelectedIds.length;
  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => localSelectedIds.includes(s.id));

  return (
    <ResponsiveDrawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      title={t("classes:selector.title")}
      layer="nested"
      headerContent={
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {t("classes:selector.selectedCount", { count: selectedCount })}
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={filteredStudents.length === 0}
              className="min-h-11 rounded-full px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allVisibleSelected
                ? t("classes:selector.deselectAll")
                : t("classes:selector.selectAll")}
            </button>
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("classes:selector.searchPlaceholder")}
            leftIcon={Search}
          />
        </div>
      }
      footer={
        <Button onClick={handleDone} className="w-full" leftIcon={Check}>
          {t("classes:selector.done", { count: selectedCount })}
        </Button>
      }
    >
      <div className="min-h-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="animate-pulse w-12 h-12 rounded-full bg-surface-variant" />
                    <div className="animate-pulse h-4 w-32 bg-surface-variant rounded" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="w-12 h-12 text-surface-variant mb-3" />
                    <p className="text-on-surface-variant">
                      {searchQuery
                        ? t("classes:selector.noResults")
                        : t("classes:selector.noStudents")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents.map((student) => {
                      const isSelected = localSelectedIds.includes(student.id);
                      return (
                        <button
                          key={student.id}
						  type="button"
                          onClick={() => handleToggleStudent(student.id)}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-xl transition-all
                            ${
                              isSelected
                                ? "bg-primary-container"
                                : "bg-surface-container-low hover:bg-surface-container"
                            }
                          `}
                        >
                          {/* Checkbox */}
                          <div
                            className={`
                              w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors
                              ${
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "border-outline bg-surface"
                              }
                            `}
                          >
                            {isSelected && (
                              <Check className="w-4 h-4 text-on-primary" />
                            )}
                          </div>

                          {/* Student Info */}
                          <div className="flex-1 text-left">
                            <p className="font-medium text-on-surface">
                              {student.name}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              {t("students:grade", { grade: student.grade })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
      </div>
    </ResponsiveDrawer>
  );
}
